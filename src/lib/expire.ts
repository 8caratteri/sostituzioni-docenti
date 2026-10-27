import { getDb } from "./db";
import { slotStartDate, hoursBefore } from "./format";

/** Scade le assegnazioni pending oltre la scadenza Accetta (2h prima dell'inizio). */
export function expireOverdueAssignments(): number {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.id, s.date, s.start_time, a.confirm_deadline
       FROM assignments a
       JOIN slots s ON s.id = a.slot_id
       WHERE a.status = 'pending'`
    )
    .all() as {
    id: number;
    date: string;
    start_time: string;
    confirm_deadline: string | null;
  }[];

  const now = Date.now();
  let n = 0;
  const upd = db.prepare(
    `UPDATE assignments SET status = 'expired', responded_at = datetime('now') WHERE id = ? AND status = 'pending'`
  );

  const tx = db.transaction(() => {
    for (const r of rows) {
      const deadline = r.confirm_deadline
        ? new Date(r.confirm_deadline).getTime()
        : hoursBefore(slotStartDate(r.date, r.start_time), 2).getTime();
      if (now >= deadline) {
        upd.run(r.id);
        n++;
      }
    }
  });
  tx();
  return n;
}
