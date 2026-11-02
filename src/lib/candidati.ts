import { getDb } from "./db";
import { weekdayFromDate } from "./slot-time";
import type { Candidato, Fascia } from "./types";

export function isTeacherAvailable(opts: {
  docenteId: string;
  sedeId: number;
  fascia: Fascia;
  date: string;
  ora: number;
}): boolean {
  return listCandidatiForSlot({
    sede_id: opts.sedeId,
    fascia: opts.fascia,
    date: opts.date,
    ora: opts.ora,
  }).some((c) => c.id === opts.docenteId && c.available);
}

export function listCandidatiForSlot(opts: {
  sede_id: number | null;
  fascia: Fascia;
  date: string;
  ora: number;
}): Candidato[] {
  if (!opts.sede_id || !opts.ora) return [];
  const weekday = weekdayFromDate(opts.date);
  if (!weekday) return [];

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email,
              COALESCE(r.ore, 0) AS ore_recupero,
              CASE WHEN d.id IS NOT NULL THEN 1 ELSE 0 END AS available
       FROM users u
       LEFT JOIN recuperi r ON r.user_id = u.id
       LEFT JOIN disponibilita_ore d
         ON d.user_id = u.id
        AND d.sede_id = ?
        AND d.fascia = ?
        AND d.weekday = ?
        AND d.ora = ?
       WHERE u.role = 'docente' AND u.active = 1
       ORDER BY available DESC, ore_recupero DESC, u.name COLLATE NOCASE`
    )
    .all(opts.sede_id, opts.fascia, weekday, opts.ora) as {
    id: string;
    name: string;
    email: string;
    ore_recupero: number;
    available: number;
  }[];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    ore_recupero: r.ore_recupero,
    available: !!r.available,
    priority: r.ore_recupero > 0,
  }));
}

export function candidatiHint(
  sedeName?: string | null,
  classeName?: string | null,
  startTime?: string | null
): string {
  const parts = [sedeName, classeName, startTime?.slice(0, 5)].filter(Boolean);
  return parts.join(" · ");
}
