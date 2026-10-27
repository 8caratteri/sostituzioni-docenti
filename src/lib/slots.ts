import { getDb } from "./db";
import { canAfford, getBudget } from "./budget";
import { expireOverdueAssignments } from "./expire";
import {
  hoursBefore,
  minutesBefore,
  slotStartDate,
} from "./format";
import type {
  AssignmentStatus,
  Role,
  SessionUser,
  SlotListItem,
  VisaStatus,
} from "./types";

const SLOT_SELECT = `
  SELECT s.*,
    u.name AS creator_name,
    a.id AS assignment_id,
    a.status AS assignment_status,
    a.is_ufficio AS is_ufficio,
    a.confirm_deadline AS confirm_deadline,
    a.docente_id AS docente_id,
    d.name AS docente_name,
    a.assigned_at AS assigned_at
  FROM slots s
  JOIN users u ON u.id = s.created_by
  LEFT JOIN assignments a ON a.id = (
    SELECT a2.id FROM assignments a2
    WHERE a2.slot_id = s.id
      AND a2.status IN ('pending','confirmed')
    ORDER BY a2.id DESC LIMIT 1
  )
  LEFT JOIN users d ON d.id = a.docente_id
`;

export function listSlots(): SlotListItem[] {
  expireOverdueAssignments();
  const db = getDb();
  return db
    .prepare(`${SLOT_SELECT} ORDER BY s.date DESC, s.start_time DESC`)
    .all() as SlotListItem[];
}

export function listAwaitingVisa(): SlotListItem[] {
  expireOverdueAssignments();
  const db = getDb();
  return db
    .prepare(
      `${SLOT_SELECT} WHERE s.visa_status = 'awaiting' ORDER BY s.date ASC, s.start_time ASC`
    )
    .all() as SlotListItem[];
}

export function getSlot(id: number): SlotListItem | undefined {
  expireOverdueAssignments();
  const db = getDb();
  return db.prepare(`${SLOT_SELECT} WHERE s.id = ?`).get(id) as
    | SlotListItem
    | undefined;
}

export function createSlot(input: {
  date: string;
  start_time: string;
  end_time: string;
  classe_id: number | null;
  sede_id: number | null;
  note?: string | null;
  motivo?: string | null;
  actor: SessionUser;
}) {
  const db = getDb();
  const budget = getBudget();
  let classe_name: string | null = null;
  let sede_name: string | null = null;
  if (input.classe_id) {
    const c = db
      .prepare(`SELECT name FROM classi WHERE id = ?`)
      .get(input.classe_id) as { name: string } | undefined;
    classe_name = c?.name ?? null;
  }
  if (input.sede_id) {
    const s = db
      .prepare(`SELECT name FROM sedi WHERE id = ?`)
      .get(input.sede_id) as { name: string } | undefined;
    sede_name = s?.name ?? null;
  }

  const visa_status: VisaStatus =
    input.actor.role === "dirigente" ? "approved" : "awaiting";

  const info = db
    .prepare(
      `INSERT INTO slots (
        date, start_time, end_time, classe_id, sede_id,
        classe_name, sede_name, note, motivo, importo_eur,
        visa_status, created_by, created_role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.date,
      input.start_time,
      input.end_time,
      input.classe_id,
      input.sede_id,
      classe_name,
      sede_name,
      input.note ?? null,
      input.motivo ?? null,
      budget.tariff_eur,
      visa_status,
      input.actor.id,
      input.actor.role
    );

  return Number(info.lastInsertRowid);
}

export function setVisa(
  slotId: number,
  status: "approved" | "rejected",
  note?: string | null
) {
  const db = getDb();
  const slot = db
    .prepare(`SELECT visa_status FROM slots WHERE id = ?`)
    .get(slotId) as { visa_status: VisaStatus } | undefined;
  if (!slot) throw new Error("Slot non trovato");
  if (slot.visa_status !== "awaiting") {
    throw new Error("Questo slot non è in attesa di visto");
  }
  db.prepare(
    `UPDATE slots SET visa_status = ?, visa_note = ? WHERE id = ?`
  ).run(status, note ?? null, slotId);
}

export function deleteSlot(slotId: number) {
  const db = getDb();
  db.prepare(`DELETE FROM slots WHERE id = ?`).run(slotId);
}

export function assignWindow(date: string, startTime: string) {
  const start = slotStartDate(date, startTime);
  const now = new Date();
  const acceptDeadline = hoursBefore(start, 2);
  const assignDeadline = minutesBefore(start, 10);
  return {
    start,
    now,
    acceptDeadline,
    assignDeadline,
    canAssignOrRemove: now.getTime() <= assignDeadline.getTime(),
    withinAcceptWindow: now.getTime() <= acceptDeadline.getTime(),
    /** Assegnazione oltre le 2 ore prima → d'ufficio */
    isUfficio: now.getTime() > acceptDeadline.getTime(),
  };
}

export function listAvailableTeachers() {
  const db = getDb();
  return db
    .prepare(
      `SELECT u.id, u.name, u.email, d.label AS disponibilita
       FROM users u
       JOIN disponibilita d ON d.user_id = u.id
       WHERE u.role = 'docente' AND u.active = 1
       ORDER BY u.name`
    )
    .all() as {
    id: string;
    name: string;
    email: string;
    disponibilita: string;
  }[];
}

export function listAllTeachersWithDisponibilita() {
  const db = getDb();
  return db
    .prepare(
      `SELECT u.id, u.name, u.email, d.label AS disponibilita, d.id AS disp_id
       FROM users u
       LEFT JOIN disponibilita d ON d.user_id = u.id
       WHERE u.role = 'docente'
       ORDER BY u.name`
    )
    .all() as {
    id: string;
    name: string;
    email: string;
    disponibilita: string | null;
    disp_id: number | null;
  }[];
}

export function assignTeacher(opts: {
  slotId: number;
  docenteId: string;
  actor: SessionUser;
}) {
  expireOverdueAssignments();
  const db = getDb();
  const slot = getSlot(opts.slotId);
  if (!slot) throw new Error("Slot non trovato");
  if (slot.visa_status !== "approved") {
    throw new Error("Serve il visto del dirigente prima di assegnare");
  }
  if (slot.assignment_status === "confirmed") {
    throw new Error("Assegnazione già confermata — non modificabile");
  }

  const win = assignWindow(slot.date, slot.start_time);
  if (!win.canAssignOrRemove) {
    throw new Error(
      "Non si può più assegnare: mancano meno di 10 minuti all'inizio"
    );
  }

  const available = listAvailableTeachers();
  if (!available.some((t) => t.id === opts.docenteId)) {
    throw new Error(
      "Il docente non è nell'elenco disponibilità: non si può assegnare"
    );
  }

  if (!canAfford(slot.importo_eur, slot.assignment_id ?? undefined)) {
    throw new Error(
      "Budget insufficiente: l'assegnazione supererebbe il tetto in euro"
    );
  }

  const isUfficio = win.isUfficio;
  const status: AssignmentStatus = isUfficio ? "confirmed" : "pending";
  const confirmDeadline = isUfficio
    ? null
    : win.acceptDeadline.toISOString();

  const tx = db.transaction(() => {
    if (slot.assignment_id) {
      db.prepare(
        `UPDATE assignments SET status = 'cancelled', responded_at = datetime('now')
         WHERE id = ? AND status IN ('pending')`
      ).run(slot.assignment_id);
    }
    db.prepare(
      `INSERT INTO assignments (
        slot_id, docente_id, status, is_ufficio, assigned_by,
        confirm_deadline, responded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      opts.slotId,
      opts.docenteId,
      status,
      isUfficio ? 1 : 0,
      opts.actor.id,
      confirmDeadline,
      isUfficio ? new Date().toISOString() : null
    );
  });
  tx();
}

export function removeAssignment(slotId: number, actor: SessionUser) {
  expireOverdueAssignments();
  const slot = getSlot(slotId);
  if (!slot) throw new Error("Slot non trovato");
  if (!slot.assignment_id) throw new Error("Nessuna assegnazione da rimuovere");
  if (slot.assignment_status === "confirmed" && !slot.is_ufficio) {
    // Accepted by teacher — locked unless staff policy allows; MVP: blocked
    throw new Error("Assegnazione accettata dal docente: non si può rimuovere");
  }
  if (slot.assignment_status === "confirmed" && slot.is_ufficio) {
    const win = assignWindow(slot.date, slot.start_time);
    if (!win.canAssignOrRemove) {
      throw new Error(
        "Non si può più rimuovere: mancano meno di 10 minuti all'inizio"
      );
    }
  } else {
    const win = assignWindow(slot.date, slot.start_time);
    if (!win.canAssignOrRemove) {
      throw new Error(
        "Non si può più rimuovere: mancano meno di 10 minuti all'inizio"
      );
    }
  }

  const db = getDb();
  db.prepare(
    `UPDATE assignments SET status = 'cancelled', responded_at = datetime('now')
     WHERE id = ? AND status IN ('pending','confirmed')`
  ).run(slot.assignment_id);
  void actor;
}

export function teacherRespond(
  assignmentId: number,
  docenteId: string,
  accept: boolean
) {
  expireOverdueAssignments();
  const db = getDb();
  const row = db
    .prepare(
      `SELECT a.*, s.date, s.start_time
       FROM assignments a
       JOIN slots s ON s.id = a.slot_id
       WHERE a.id = ?`
    )
    .get(assignmentId) as
    | {
        id: number;
        docente_id: string;
        status: AssignmentStatus;
        is_ufficio: number;
        date: string;
        start_time: string;
        confirm_deadline: string | null;
      }
    | undefined;

  if (!row) throw new Error("Assegnazione non trovata");
  if (row.docente_id !== docenteId) throw new Error("Non autorizzato");
  if (row.status !== "pending") {
    throw new Error("Questa proposta non è più in attesa");
  }
  if (row.is_ufficio) {
    throw new Error("Assegnazione d'ufficio: non richiede Accetta");
  }

  const win = assignWindow(row.date, row.start_time);
  if (!win.withinAcceptWindow) {
    db.prepare(
      `UPDATE assignments SET status = 'expired', responded_at = datetime('now') WHERE id = ?`
    ).run(assignmentId);
    throw new Error(
      "Tempo scaduto: si poteva accettare solo fino a 2 ore prima dell'inizio"
    );
  }

  db.prepare(
    `UPDATE assignments SET status = ?, responded_at = datetime('now') WHERE id = ?`
  ).run(accept ? "confirmed" : "refused", assignmentId);
}

/** Docente si propone su uno slot libero (già vistato). */
export function teacherPropose(slotId: number, docenteId: string) {
  expireOverdueAssignments();
  const slot = getSlot(slotId);
  if (!slot) throw new Error("Slot non trovato");
  if (slot.visa_status !== "approved") {
    throw new Error("Slot non ancora vistato");
  }
  if (slot.assignment_id) {
    throw new Error("Slot già assegnato");
  }

  const available = listAvailableTeachers();
  if (!available.some((t) => t.id === docenteId)) {
    throw new Error("Non risulti nell'elenco disponibilità");
  }

  if (!canAfford(slot.importo_eur)) {
    throw new Error("Budget insufficiente per questa proposta");
  }

  const win = assignWindow(slot.date, slot.start_time);
  if (!win.canAssignOrRemove) {
    throw new Error("Troppo tardi per proporsi su questo slot");
  }

  const db = getDb();
  const isUfficio = win.isUfficio;
  const status: AssignmentStatus = isUfficio ? "confirmed" : "pending";
  db.prepare(
    `INSERT INTO assignments (
      slot_id, docente_id, status, is_ufficio, assigned_by,
      confirm_deadline, responded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    slotId,
    docenteId,
    status,
    isUfficio ? 1 : 0,
    docenteId,
    isUfficio ? null : win.acceptDeadline.toISOString(),
    isUfficio ? new Date().toISOString() : null
  );
}

export function listTeacherAssignments(docenteId: string) {
  expireOverdueAssignments();
  const db = getDb();
  return db
    .prepare(
      `SELECT a.*, s.date, s.start_time, s.end_time, s.classe_name, s.sede_name,
              s.note, s.motivo, s.visa_status, s.importo_eur
       FROM assignments a
       JOIN slots s ON s.id = a.slot_id
       WHERE a.docente_id = ?
         AND a.status IN ('pending','confirmed','refused','expired','cancelled')
       ORDER BY s.date DESC, s.start_time DESC`
    )
    .all(docenteId) as Array<{
    id: number;
    slot_id: number;
    status: AssignmentStatus;
    is_ufficio: number;
    confirm_deadline: string | null;
    assigned_at: string;
    date: string;
    start_time: string;
    end_time: string;
    classe_name: string | null;
    sede_name: string | null;
    note: string | null;
    motivo: string | null;
    visa_status: VisaStatus;
    importo_eur: number;
  }>;
}

export function listOpenSlotsForTeachers() {
  expireOverdueAssignments();
  const db = getDb();
  return db
    .prepare(
      `${SLOT_SELECT}
       WHERE s.visa_status = 'approved'
         AND a.id IS NULL
       ORDER BY s.date ASC, s.start_time ASC`
    )
    .all() as SlotListItem[];
}

export function isStaff(role: Role) {
  return role === "segreteria" || role === "dirigente";
}
