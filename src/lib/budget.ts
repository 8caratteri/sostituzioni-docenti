import { getDb } from "./db";
import type { BudgetRow } from "./types";

export function getBudget(): BudgetRow {
  return getDb().prepare("SELECT * FROM budget WHERE id = 1").get() as BudgetRow;
}

export function updateBudget(totalEur: number, tariffEur: number) {
  getDb()
    .prepare(
      `UPDATE budget SET total_eur = ?, tariff_eur = ?, updated_at = datetime('now') WHERE id = 1`
    )
    .run(totalEur, tariffEur);
}

/** Solo assegnazioni a pagamento (non recupero). */
const PAID = `a.status IN ('pending', 'confirmed') AND a.is_recupero = 0`;

export function getImpegnoEur(): number {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(s.importo_eur), 0) AS totale
       FROM assignments a JOIN slots s ON s.id = a.slot_id
       WHERE ${PAID}`
    )
    .get() as { totale: number };
  return row.totale;
}

export function getDovutoEur(): number {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(s.importo_eur), 0) AS totale
       FROM assignments a JOIN slots s ON s.id = a.slot_id
       WHERE a.status = 'confirmed' AND a.is_recupero = 0`
    )
    .get() as { totale: number };
  return row.totale;
}

export function getPendingEur(): number {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(SUM(s.importo_eur), 0) AS totale
       FROM assignments a JOIN slots s ON s.id = a.slot_id
       WHERE a.status = 'pending' AND a.is_recupero = 0`
    )
    .get() as { totale: number };
  return row.totale;
}

export function getBudgetSummary() {
  const budget = getBudget();
  const impegnato = getImpegnoEur();
  return {
    totale: budget.total_eur,
    tariffa: budget.tariff_eur,
    impegnato,
    dovuto: getDovutoEur(),
    pending: getPendingEur(),
    residuo: budget.total_eur - impegnato,
  };
}

export function canAfford(importo: number, excludeAssignmentId?: number): boolean {
  const budget = getBudget();
  let sql = `SELECT COALESCE(SUM(s.importo_eur), 0) AS totale
             FROM assignments a JOIN slots s ON s.id = a.slot_id
             WHERE ${PAID}`;
  const params: number[] = [];
  if (excludeAssignmentId) {
    sql += ` AND a.id != ?`;
    params.push(excludeAssignmentId);
  }
  const row = getDb().prepare(sql).get(...params) as { totale: number };
  return row.totale + importo <= budget.total_eur + 1e-9;
}
