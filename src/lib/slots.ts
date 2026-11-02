import { listCandidatiForSlot } from "./candidati";
import { getDb } from "./db";
import { expireOverdueAssignments } from "./expire";
import {
  hoursBefore,
  minutesBefore,
  slotStartDate,
} from "./format";
import { canAfford } from "./budget";
import {
  consumeRecupero,
  resolvePagamento,
  restoreRecupero,
} from "./pagamento";
import { canAssign, canVisa } from "./permissions";
import type {
  AssignmentStatus,
  SessionUser,
  SlotListItem,
  TeacherAssignOption,
  VisaStatus,
} from "./types";

export type { SlotListItem, TeacherAssignOption };

const SLOT_SELECT = `
  SELECT s.*,
    u.name AS creator_name,
    a.id AS assignment_id,
    a.status AS assignment_status,
    a.is_ufficio,
    a.is_recupero,
    a.refuse_motivo,
    a.confirm_deadline,
    a.docente_id,
    du.name AS docente_name,
    a.assigned_at,
    (SELECT COUNT(*) FROM proposte p WHERE p.slot_id = s.id AND p.status = 'pending') AS proposte_count,
    (
      SELECT a3.refuse_motivo FROM assignments a3
      WHERE a3.slot_id = s.id AND a3.status = 'refused'
        AND a3.refuse_motivo IS NOT NULL AND trim(a3.refuse_motivo) != ''
      ORDER BY a3.responded_at DESC LIMIT 1
    ) AS last_refuse_motivo,
    (
      SELECT u3.name FROM assignments a3
      JOIN users u3 ON u3.id = a3.docente_id
      WHERE a3.slot_id = s.id AND a3.status = 'refused'
        AND a3.refuse_motivo IS NOT NULL AND trim(a3.refuse_motivo) != ''
      ORDER BY a3.responded_at DESC LIMIT 1
    ) AS last_refuse_docente_name
  FROM slots s
  JOIN users u ON u.id = s.created_by
  LEFT JOIN assignments a ON a.slot_id = s.id
    AND a.id = (
      SELECT a2.id FROM assignments a2
      WHERE a2.slot_id = s.id
        AND a2.status IN ('pending','confirmed')
      ORDER BY a2.assigned_at DESC LIMIT 1
    )
  LEFT JOIN users du ON du.id = a.docente_id
`;

export function listSlots(): SlotListItem[] {
  expireOverdueAssignments();
  return getDb()
    .prepare(`${SLOT_SELECT} ORDER BY s.date DESC, s.start_time DESC`)
    .all() as SlotListItem[];
}

export function createSlot(input: {
  date: string;
  start_time: string;
  end_time: string;
  ora: number;
  fascia: "mattina" | "pomeriggio";
  classe_id: number | null;
  sede_id: number | null;
  classe_name: string | null;
  sede_name: string | null;
  note: string | null;
  motivo: string | null;
  importo_eur: number;
  actor: SessionUser;
}) {
  const visa: VisaStatus =
    input.actor.role === "dirigente" ? "approved" : "awaiting";
  const info = getDb()
    .prepare(
      `INSERT INTO slots (
         date, start_time, end_time, ora, fascia,
         classe_id, sede_id, classe_name, sede_name,
         note, motivo, importo_eur, visa_status, created_by, created_role
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.date,
      input.start_time,
      input.end_time,
      input.ora,
      input.fascia,
      input.classe_id,
      input.sede_id,
      input.classe_name,
      input.sede_name,
      input.note,
      input.motivo,
      input.importo_eur,
      visa,
      input.actor.id,
      input.actor.role
    );
  return Number(info.lastInsertRowid);
}

export function deleteSlot(slotId: number) {
  getDb().prepare(`DELETE FROM slots WHERE id = ?`).run(slotId);
}

export function setVisa(
  slotId: number,
  decision: "approved" | "rejected",
  note: string | null
) {
  const db = getDb();
  const slot = db
    .prepare(`SELECT * FROM slots WHERE id = ?`)
    .get(slotId) as { visa_status: string } | undefined;
  if (!slot || slot.visa_status !== "awaiting") {
    throw new Error("Questo slot non è in attesa di visto");
  }
  db.prepare(
    `UPDATE slots SET visa_status = ?, visa_note = ? WHERE id = ?`
  ).run(decision, note, slotId);

  if (decision === "rejected") {
    const pending = db
      .prepare(
        `SELECT id, docente_id, is_recupero FROM assignments WHERE slot_id = ? AND status = 'pending'`
      )
      .all(slotId) as { id: number; docente_id: string; is_recupero: number }[];
    for (const a of pending) {
      restoreRecupero(a.docente_id, !!a.is_recupero);
      db.prepare(
        `UPDATE assignments SET status = 'cancelled', responded_at = datetime('now') WHERE id = ?`
      ).run(a.id);
    }
  } else {
    // ufficio → confirmed on visa
    db.prepare(
      `UPDATE assignments SET status = 'confirmed', responded_at = datetime('now')
       WHERE slot_id = ? AND status = 'pending' AND is_ufficio = 1`
    ).run(slotId);
  }
}

function assignWindow(date: string, start: string) {
  const startDt = slotStartDate(date, start);
  const acceptDeadline = hoursBefore(startDt, 2);
  const assignDeadline = minutesBefore(startDt, 10);
  const now = Date.now();
  return { startDt, acceptDeadline, assignDeadline, now };
}

export function listTeachersForSlot(slot: {
  sede_id: number | null;
  fascia: "mattina" | "pomeriggio";
  date: string;
  ora: number;
}): TeacherAssignOption[] {
  return listCandidatiForSlot({
    sede_id: slot.sede_id,
    fascia: slot.fascia,
    date: slot.date,
    ora: slot.ora,
  })
    .filter((c) => c.available)
    .map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      ore_recupero: c.ore_recupero,
      priority: c.priority,
    }));
}

export function listAllTeachersWithRecuperi(): TeacherAssignOption[] {
  return (
    getDb()
      .prepare(
        `SELECT u.id, u.name, u.email, COALESCE(r.ore, 0) AS ore_recupero
         FROM users u
         LEFT JOIN recuperi r ON r.user_id = u.id
         WHERE u.role = 'docente' AND u.active = 1
         ORDER BY ore_recupero DESC, u.name COLLATE NOCASE`
      )
      .all() as {
      id: string;
      name: string;
      email: string;
      ore_recupero: number;
    }[]
  ).map((t) => ({
    ...t,
    priority: t.ore_recupero > 0,
  }));
}

export function assignTeacher(input: {
  slotId: number;
  docenteId: string;
  actor: SessionUser;
  allowOutsideDisponibilita?: boolean;
}) {
  if (!canAssign(input.actor.role)) throw new Error("Non autorizzato");
  const db = getDb();
  const slot = db
    .prepare(`SELECT * FROM slots WHERE id = ?`)
    .get(input.slotId) as
    | {
        id: number;
        date: string;
        start_time: string;
        sede_id: number | null;
        fascia: "mattina" | "pomeriggio";
        ora: number;
        visa_status: VisaStatus;
        importo_eur: number;
      }
    | undefined;
  if (!slot) throw new Error("Slot non trovato");
  if (slot.visa_status === "rejected") throw new Error("Visto rifiutato");

  const win = assignWindow(slot.date, slot.start_time);
  if (win.now > win.assignDeadline.getTime()) {
    throw new Error("Troppo tardi per assegnare (limite 10 minuti prima)");
  }

  const active = db
    .prepare(
      `SELECT id FROM assignments WHERE slot_id = ? AND status IN ('pending','confirmed')`
    )
    .get(slot.id);
  if (active) throw new Error("Slot già assegnato");

  if (!input.allowOutsideDisponibilita) {
    const ok = listCandidatiForSlot({
      sede_id: slot.sede_id,
      fascia: slot.fascia,
      date: slot.date,
      ora: slot.ora,
    }).some((c) => c.id === input.docenteId && c.available);
    if (!ok) {
      throw new Error(
        "Il docente non è disponibile per questo plesso, giorno e ora"
      );
    }
  }

  const pay = resolvePagamento(input.docenteId);
  if (!pay.isRecupero) {
    if (!canAfford(slot.importo_eur)) {
      throw new Error("Budget insufficiente");
    }
  }

  const isUfficio = win.now > win.acceptDeadline.getTime() ? 1 : 0;
  let status: AssignmentStatus = "pending";
  if (isUfficio && slot.visa_status === "approved") {
    status = "confirmed";
  }

  if (pay.isRecupero) consumeRecupero(input.docenteId);

  db.prepare(
    `INSERT INTO assignments (
       slot_id, docente_id, status, is_ufficio, is_recupero,
       assigned_by, confirm_deadline
     ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    slot.id,
    input.docenteId,
    status,
    isUfficio,
    pay.isRecupero ? 1 : 0,
    input.actor.id,
    win.acceptDeadline.toISOString()
  );

  db.prepare(
    `UPDATE proposte SET status = 'rejected' WHERE slot_id = ? AND status = 'pending'`
  ).run(slot.id);
}

export function removeAssignment(slotId: number, actor: SessionUser) {
  if (!canAssign(actor.role)) throw new Error("Non autorizzato");
  const db = getDb();
  const a = db
    .prepare(
      `SELECT * FROM assignments WHERE slot_id = ? AND status IN ('pending','confirmed')
       ORDER BY assigned_at DESC LIMIT 1`
    )
    .get(slotId) as
    | {
        id: number;
        docente_id: string;
        is_recupero: number;
        status: string;
        is_ufficio: number;
      }
    | undefined;
  if (!a) throw new Error("Nessuna assegnazione attiva");

  const slot = db
    .prepare(`SELECT date, start_time FROM slots WHERE id = ?`)
    .get(slotId) as { date: string; start_time: string };
  const win = assignWindow(slot.date, slot.start_time);
  if (win.now > win.assignDeadline.getTime()) {
    throw new Error("Troppo tardi per rimuovere");
  }
  if (a.status === "confirmed" && !a.is_ufficio) {
    throw new Error("Assegnazione già accettata dal docente");
  }

  restoreRecupero(a.docente_id, !!a.is_recupero);
  db.prepare(
    `UPDATE assignments SET status = 'cancelled', responded_at = datetime('now') WHERE id = ?`
  ).run(a.id);
}

export function teacherRespond(
  assignmentId: number,
  docenteId: string,
  accept: boolean,
  refuseMotivo?: string | null
) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT a.*, s.date, s.start_time, s.visa_status
       FROM assignments a JOIN slots s ON s.id = a.slot_id WHERE a.id = ?`
    )
    .get(assignmentId) as
    | {
        id: number;
        docente_id: string;
        status: string;
        is_ufficio: number;
        is_recupero: number;
        date: string;
        start_time: string;
        visa_status: string;
      }
    | undefined;
  if (!row || row.docente_id !== docenteId) {
    throw new Error("Assegnazione non trovata");
  }
  if (row.status !== "pending") {
    throw new Error("Questa proposta non è più in attesa");
  }
  if (row.is_ufficio) {
    throw new Error("Assegnazione d'ufficio: non richiede Accetta");
  }
  if (row.visa_status !== "approved") {
    throw new Error("In attesa del visto del preside prima di accettare");
  }

  const win = assignWindow(row.date, row.start_time);
  if (win.now > win.acceptDeadline.getTime()) {
    throw new Error("Tempo scaduto per accettare");
  }

  if (!accept) {
    const motivo = (refuseMotivo || "").trim();
    if (motivo.length < 3) {
      throw new Error("Indica il motivo del rifiuto (obbligatorio)");
    }
    restoreRecupero(row.docente_id, !!row.is_recupero);
    db.prepare(
      `UPDATE assignments SET status = 'refused', responded_at = datetime('now'), refuse_motivo = ? WHERE id = ?`
    ).run(motivo, assignmentId);
    return;
  }

  db.prepare(
    `UPDATE assignments SET status = 'confirmed', responded_at = datetime('now'), refuse_motivo = NULL WHERE id = ?`
  ).run(assignmentId);
}

export function listTeacherAssignments(docenteId: string) {
  expireOverdueAssignments();
  return getDb()
    .prepare(
      `SELECT a.*, s.date, s.start_time, s.end_time, s.ora, s.fascia,
              s.classe_name, s.sede_name, s.visa_status, s.motivo, s.importo_eur
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
    is_recupero: number;
    refuse_motivo: string | null;
    confirm_deadline: string | null;
    date: string;
    start_time: string;
    end_time: string;
    ora: number;
    fascia: string;
    classe_name: string | null;
    sede_name: string | null;
    visa_status: VisaStatus;
    motivo: string | null;
    importo_eur: number;
  }>;
}

export type TeacherAssignmentRow = ReturnType<
  typeof listTeacherAssignments
>[number];

export function getTeacherWithRecupero(id: string) {
  return getDb()
    .prepare(
      `SELECT u.*, COALESCE(r.ore, 0) AS ore_recupero
       FROM users u LEFT JOIN recuperi r ON r.user_id = u.id
       WHERE u.id = ?`
    )
    .get(id) as
    | {
        id: string;
        name: string;
        email: string;
        role: string;
        ore_recupero: number;
      }
    | undefined;
}

export function groupTeacherAssignments(rows: TeacherAssignmentRow[]) {
  const now = Date.now();
  const inCorso: TeacherAssignmentRow[] = [];
  const future: TeacherAssignmentRow[] = [];
  const svolte: TeacherAssignmentRow[] = [];
  for (const r of rows) {
    if (r.status !== "pending" && r.status !== "confirmed") {
      svolte.push(r);
      continue;
    }
    const start = slotStartDate(r.date, r.start_time).getTime();
    const end = slotStartDate(r.date, r.end_time).getTime();
    if (now >= start && now <= end) inCorso.push(r);
    else if (now < start) future.push(r);
    else svolte.push(r);
  }
  return { inCorso, future, svolte };
}

export function teacherHoursSummary(docenteId: string) {
  return groupTeacherAssignments(listTeacherAssignments(docenteId));
}

export function isStaff(role: import("./types").Role) {
  return (
    role === "segreteria" ||
    role === "vicepreside" ||
    role === "dirigente"
  );
}

export function listOpenSlotsForTeachers(docenteId?: string) {
  expireOverdueAssignments();
  const rows = getDb()
    .prepare(
      `SELECT s.* FROM slots s
       WHERE s.visa_status != 'rejected'
         AND NOT EXISTS (
           SELECT 1 FROM assignments a
           WHERE a.slot_id = s.id AND a.status IN ('pending','confirmed')
         )
       ORDER BY s.date ASC, s.start_time ASC`
    )
    .all() as Array<{
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    ora: number;
    fascia: "mattina" | "pomeriggio";
    sede_id: number | null;
    classe_name: string | null;
    sede_name: string | null;
    motivo: string | null;
    visa_status: VisaStatus;
  }>;

  if (!docenteId) return rows;

  return rows.filter((s) => {
    if (!s.sede_id) return false;
    return listCandidatiForSlot({
      sede_id: s.sede_id,
      fascia: s.fascia,
      date: s.date,
      ora: s.ora,
    }).some((c) => c.id === docenteId && c.available);
  });
}

// legacy alias used by page.tsx
export { canVisa };
