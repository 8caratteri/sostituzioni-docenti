import { getDb } from "./db";
import type { BudgetRow } from "./types";

export function getBudget(): BudgetRow {
  const db = getDb();
  return db.prepare("SELECT * FROM budget WHERE id = 1").get() as BudgetRow;
}

export function updateBudget(totalEur: number, tariffEur: number) {
  const db = getDb();
  db.prepare(
    `UPDATE budget SET total_eur = ?, tariff_eur = ?, updated_at = datetime('now') WHERE id = 1`
  ).run(totalEur, tariffEur);
}

/** Somma importi di assegnazioni pending + confirmed (impegno budget). */
export function getImpegnoEur(): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(s.importo_eur), 0) AS totale
       FROM assignments a
       JOIN slots s ON s.id = a.slot_id
       WHERE a.status IN ('pending', 'confirmed')`
    )
    .get() as { totale: number };
  return row.totale;
}

export function getDovutoEur(): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(s.importo_eur), 0) AS totale
       FROM assignments a
       JOIN slots s ON s.id = a.slot_id
       WHERE a.status = 'confirmed'`
    )
    .get() as { totale: number };
  return row.totale;
}

export function getPendingEur(): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(s.importo_eur), 0) AS totale
       FROM assignments a
       JOIN slots s ON s.id = a.slot_id
       WHERE a.status = 'pending'`
    )
    .get() as { totale: number };
  return row.totale;
}

export function getBudgetSummary() {
  const budget = getBudget();
  const impegnato = getImpegnoEur();
  const dovuto = getDovutoEur();
  const pending = getPendingEur();
  const residuo = budget.total_eur - impegnato;
  return {
    totale: budget.total_eur,
    tariffa: budget.tariff_eur,
    impegnato,
    dovuto,
    pending,
    residuo,
  };
}

export function canAfford(importo: number, excludeAssignmentId?: number): boolean {
  const budget = getBudget();
  const db = getDb();
  let sql = `SELECT COALESCE(SUM(s.importo_eur), 0) AS totale
             FROM assignments a
             JOIN slots s ON s.id = a.slot_id
             WHERE a.status IN ('pending', 'confirmed')`;
  const params: number[] = [];
  if (excludeAssignmentId) {
    sql += ` AND a.id != ?`;
    params.push(excludeAssignmentId);
  }
  const row = db.prepare(sql).get(...params) as { totale: number };
  return row.totale + importo <= budget.total_eur + 1e-9;
}
