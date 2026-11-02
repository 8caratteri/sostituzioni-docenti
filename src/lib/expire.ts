import { getDb } from "./db";
import { hoursBefore, slotStartDate } from "./format";
import { restoreRecupero } from "./pagamento";

/** Scade le assegnazioni pending oltre la scadenza Accetta (2h prima). */
export function expireOverdueAssignments() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.id, a.docente_id, a.is_recupero, a.is_ufficio,
              a.confirm_deadline, s.date, s.start_time, s.visa_status
       FROM assignments a
       JOIN slots s ON s.id = a.slot_id
       WHERE a.status = 'pending'`
    )
    .all() as {
    id: number;
    docente_id: string;
    is_recupero: number;
    is_ufficio: number;
    confirm_deadline: string | null;
    date: string;
    start_time: string;
    visa_status: string;
  }[];

  const now = Date.now();
  const upd = db.prepare(
    `UPDATE assignments SET status = 'expired', responded_at = datetime('now')
     WHERE id = ? AND status = 'pending'`
  );

  for (const r of rows) {
    if (r.is_ufficio) continue;
    if (r.visa_status !== "approved") continue;
    const deadline = r.confirm_deadline
      ? new Date(r.confirm_deadline).getTime()
      : hoursBefore(slotStartDate(r.date, r.start_time), 2).getTime();
    if (now > deadline) {
      restoreRecupero(r.docente_id, !!r.is_recupero);
      upd.run(r.id);
    }
  }
}
