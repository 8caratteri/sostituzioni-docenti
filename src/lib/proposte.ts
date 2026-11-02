import { getDb } from "./db";
import { listCandidatiForSlot } from "./candidati";
import { assignTeacher } from "./slots";
import type { SessionUser } from "./types";

export type PropostaListItem = {
  id: number;
  slot_id: number;
  docente_id: string;
  docente_name: string;
  status: string;
  created_at: string;
};

export function listProposteForSlot(slotId: number): PropostaListItem[] {
  return getDb()
    .prepare(
      `SELECT p.*, u.name AS docente_name
       FROM proposte p
       JOIN users u ON u.id = p.docente_id
       WHERE p.status = 'pending' AND p.slot_id = ?
       ORDER BY p.created_at ASC`
    )
    .all(slotId) as PropostaListItem[];
}

export function listPendingProposteBySlots(slotIds: number[]) {
  const map = new Map<number, PropostaListItem[]>();
  if (slotIds.length === 0) return map;
  const placeholders = slotIds.map(() => "?").join(",");
  const rows = getDb()
    .prepare(
      `SELECT p.*, u.name AS docente_name
       FROM proposte p
       JOIN users u ON u.id = p.docente_id
       WHERE p.status = 'pending' AND p.slot_id IN (${placeholders})
       ORDER BY p.created_at ASC`
    )
    .all(...slotIds) as PropostaListItem[];
  for (const r of rows) {
    const list = map.get(r.slot_id) || [];
    list.push(r);
    map.set(r.slot_id, list);
  }
  return map;
}

export function teacherHasPendingProposta(slotId: number, docenteId: string) {
  const row = getDb()
    .prepare(
      `SELECT id FROM proposte WHERE slot_id = ? AND docente_id = ? AND status = 'pending'`
    )
    .get(slotId, docenteId);
  return !!row;
}

export function teacherPropose(slotId: number, docenteId: string) {
  const db = getDb();
  const slot = db
    .prepare(`SELECT * FROM slots WHERE id = ?`)
    .get(slotId) as
    | {
        id: number;
        sede_id: number | null;
        fascia: "mattina" | "pomeriggio";
        date: string;
        ora: number;
      }
    | undefined;
  if (!slot) throw new Error("Slot non trovato");

  const active = db
    .prepare(
      `SELECT id FROM assignments WHERE slot_id = ? AND status IN ('pending','confirmed')`
    )
    .get(slotId);
  if (active) throw new Error("Slot già assegnato");

  const ok = listCandidatiForSlot({
    sede_id: slot.sede_id,
    fascia: slot.fascia,
    date: slot.date,
    ora: slot.ora,
  }).some((c) => c.id === docenteId && c.available);
  if (!ok) {
    throw new Error("Non risulti disponibile per questo plesso, giorno e ora");
  }

  const existing = db
    .prepare(
      `SELECT id, status FROM proposte WHERE slot_id = ? AND docente_id = ?`
    )
    .get(slotId, docenteId) as { id: number; status: string } | undefined;

  if (existing?.status === "pending") return;
  if (existing) {
    db.prepare(
      `UPDATE proposte SET status = 'pending', created_at = datetime('now') WHERE id = ?`
    ).run(existing.id);
  } else {
    db.prepare(
      `INSERT INTO proposte (slot_id, docente_id, status) VALUES (?, ?, 'pending')`
    ).run(slotId, docenteId);
  }
}

export function acceptProposta(propostaId: number, actor: SessionUser) {
  const db = getDb();
  const p = db
    .prepare(`SELECT * FROM proposte WHERE id = ?`)
    .get(propostaId) as
    | { id: number; slot_id: number; docente_id: string; status: string }
    | undefined;
  if (!p || p.status !== "pending") throw new Error("Proposta non più in attesa");
  assignTeacher({
    slotId: p.slot_id,
    docenteId: p.docente_id,
    actor,
    allowOutsideDisponibilita: true,
  });
  db.prepare(`UPDATE proposte SET status = 'accepted' WHERE id = ?`).run(propostaId);
  db.prepare(
    `UPDATE proposte SET status = 'rejected' WHERE slot_id = ? AND status = 'pending'`
  ).run(p.slot_id);
}

export function rejectProposta(propostaId: number, actor: SessionUser) {
  void actor;
  const db = getDb();
  const p = db
    .prepare(`SELECT * FROM proposte WHERE id = ?`)
    .get(propostaId) as { status: string } | undefined;
  if (!p || p.status !== "pending") throw new Error("Proposta non più in attesa");
  db.prepare(`UPDATE proposte SET status = 'rejected' WHERE id = ?`).run(propostaId);
}
