import { getDb } from "./db";
import { getBudget } from "./budget";

export function getOreRecupero(userId: string): number {
  const row = getDb()
    .prepare(`SELECT ore FROM recuperi WHERE user_id = ?`)
    .get(userId) as { ore: number } | undefined;
  return row?.ore ?? 0;
}

export function setOreRecupero(userId: string, ore: number) {
  const n = Math.max(0, Number(ore) || 0);
  getDb()
    .prepare(
      `INSERT INTO recuperi (user_id, ore, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET ore = excluded.ore, updated_at = datetime('now')`
    )
    .run(userId, n);
}

/** Decide se l'assegnazione è recupero (0 €) o a pagamento. */
export function resolvePagamento(docenteId: string): {
  isRecupero: boolean;
  importoEur: number;
} {
  const ore = getOreRecupero(docenteId);
  if (ore > 0) {
    return { isRecupero: true, importoEur: 0 };
  }
  const budget = getBudget();
  return { isRecupero: false, importoEur: budget.tariff_eur };
}

/** Scala 1 ora di recupero all'assegnazione. */
export function consumeRecupero(docenteId: string): void {
  const db = getDb();
  const ore = getOreRecupero(docenteId);
  if (ore <= 0) return;
  db.prepare(
    `UPDATE recuperi SET ore = ?, updated_at = datetime('now') WHERE user_id = ?`
  ).run(Math.max(0, ore - 1), docenteId);
}

/** Restituisce l'ora di recupero se l'assegnazione era un recupero. */
export function restoreRecupero(docenteId: string, wasRecupero: boolean): void {
  if (!wasRecupero) return;
  const db = getDb();
  const ore = getOreRecupero(docenteId);
  db.prepare(
    `INSERT INTO recuperi (user_id, ore, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET ore = ?, updated_at = datetime('now')`
  ).run(docenteId, ore + 1, ore + 1);
}

export function effectiveImporto(
  slotImporto: number,
  isRecupero: number | boolean | null | undefined
): number {
  if (isRecupero) return 0;
  return slotImporto;
}
