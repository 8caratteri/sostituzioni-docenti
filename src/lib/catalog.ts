import { getDb } from "./db";
import type { ClasseRow, SedeRow } from "./types";

export function listClassi(): ClasseRow[] {
  return getDb()
    .prepare(`SELECT * FROM classi ORDER BY name`)
    .all() as ClasseRow[];
}

export function listSedi(): SedeRow[] {
  return getDb()
    .prepare(`SELECT * FROM sedi ORDER BY name`)
    .all() as SedeRow[];
}

export function addClasse(name: string) {
  const n = name.trim();
  if (!n) throw new Error("Nome classe obbligatorio");
  getDb().prepare(`INSERT INTO classi (name) VALUES (?)`).run(n);
}

export function deleteClasse(id: number) {
  getDb().prepare(`DELETE FROM classi WHERE id = ?`).run(id);
}

export function addSede(name: string) {
  const n = name.trim();
  if (!n) throw new Error("Nome sede obbligatorio");
  getDb().prepare(`INSERT INTO sedi (name) VALUES (?)`).run(n);
}

export function deleteSede(id: number) {
  getDb().prepare(`DELETE FROM sedi WHERE id = ?`).run(id);
}

export function setDisponibilita(userId: string, label: string) {
  const db = getDb();
  const l = label.trim();
  if (!l) {
    db.prepare(`DELETE FROM disponibilita WHERE user_id = ?`).run(userId);
    return;
  }
  db.prepare(
    `INSERT INTO disponibilita (user_id, label) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET label = excluded.label`
  ).run(userId, l);
}

export function removeDisponibilita(userId: string) {
  getDb().prepare(`DELETE FROM disponibilita WHERE user_id = ?`).run(userId);
}
