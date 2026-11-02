import { getDb } from "./db";
import { setOreRecupero } from "./pagamento";
import type { ClasseRow, Fascia, SedeRow, UserRow } from "./types";

export function listSedi(): SedeRow[] {
  return getDb()
    .prepare(`SELECT * FROM sedi ORDER BY name COLLATE NOCASE`)
    .all() as SedeRow[];
}

export function listClassi(sedeId?: number): (ClasseRow & { sede_name?: string })[] {
  if (sedeId) {
    return getDb()
      .prepare(
        `SELECT c.*, s.name AS sede_name FROM classi c
         JOIN sedi s ON s.id = c.sede_id
         WHERE c.sede_id = ?
         ORDER BY c.fascia, c.name`
      )
      .all(sedeId) as (ClasseRow & { sede_name?: string })[];
  }
  return getDb()
    .prepare(
      `SELECT c.*, s.name AS sede_name FROM classi c
       JOIN sedi s ON s.id = c.sede_id
       ORDER BY s.name, c.fascia, c.name`
    )
    .all() as (ClasseRow & { sede_name?: string })[];
}

export function addSede(name: string, fasciaDefault: Fascia | "mista" = "mattina") {
  getDb()
    .prepare(`INSERT INTO sedi (name, fascia_default) VALUES (?, ?)`)
    .run(name.trim(), fasciaDefault);
}

export function deleteSede(id: number) {
  getDb().prepare(`DELETE FROM sedi WHERE id = ?`).run(id);
}

export function addClasse(name: string, sedeId: number, fascia: Fascia) {
  getDb()
    .prepare(`INSERT INTO classi (name, sede_id, fascia) VALUES (?, ?, ?)`)
    .run(name.trim(), sedeId, fascia);
}

export function deleteClasse(id: number) {
  getDb().prepare(`DELETE FROM classi WHERE id = ?`).run(id);
}

export function listDocenti(opts?: { includeInactive?: boolean }): UserRow[] {
  if (opts?.includeInactive) {
    return getDb()
      .prepare(
        `SELECT * FROM users WHERE role = 'docente' ORDER BY name COLLATE NOCASE`
      )
      .all() as UserRow[];
  }
  return getDb()
    .prepare(
      `SELECT * FROM users WHERE role = 'docente' AND active = 1 ORDER BY name COLLATE NOCASE`
    )
    .all() as UserRow[];
}

export function getDocente(id: string): UserRow | undefined {
  return getDb()
    .prepare(`SELECT * FROM users WHERE id = ? AND role = 'docente'`)
    .get(id) as UserRow | undefined;
}

export type PlessoWithClassi = SedeRow & {
  classi: (ClasseRow & { sede_name?: string })[];
};

export function listPlessiNested(): PlessoWithClassi[] {
  const sedi = listSedi();
  const classi = listClassi();
  return sedi.map((s) => ({
    ...s,
    classi: classi.filter((c) => c.sede_id === s.id),
  }));
}

export function listDisponibilitaOre(userId: string) {
  return getDb()
    .prepare(
      `SELECT sede_id, fascia, weekday, ora FROM disponibilita_ore WHERE user_id = ?`
    )
    .all(userId) as {
    sede_id: number;
    fascia: Fascia;
    weekday: number;
    ora: number;
  }[];
}

export function setDisponibilitaOre(
  userId: string,
  cells: {
    sede_id: number;
    fascia: Fascia;
    weekday: number;
    ora: number;
  }[]
) {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM disponibilita_ore WHERE user_id = ?`).run(userId);
    const ins = db.prepare(
      `INSERT INTO disponibilita_ore (user_id, sede_id, fascia, weekday, ora)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const c of cells) {
      ins.run(userId, c.sede_id, c.fascia, c.weekday, c.ora);
    }
  });
  tx();
}

export function addDocente(name: string, email: string | null) {
  const id =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `docente-${Date.now()}`;
  const mail = email?.trim() || `${id}@demo.local`;
  getDb()
    .prepare(
      `INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, 'docente')`
    )
    .run(id, mail, name.trim());
  setOreRecupero(id, 0);
  return id;
}

export function deleteDocente(id: string) {
  getDb().prepare(`UPDATE users SET active = 0 WHERE id = ? AND role = 'docente'`).run(id);
}

export function listDisponibilitaFor(userId: string) {
  return getDb()
    .prepare(
      `SELECT d.*, s.name AS sede_name
       FROM disponibilita_ore d
       JOIN sedi s ON s.id = d.sede_id
       WHERE d.user_id = ?
       ORDER BY s.name, d.fascia, d.weekday, d.ora`
    )
    .all(userId) as {
    id: number;
    user_id: string;
    sede_id: number;
    fascia: Fascia;
    weekday: number;
    ora: number;
    sede_name: string;
  }[];
}

export function toggleDisponibilitaCell(input: {
  userId: string;
  sedeId: number;
  fascia: Fascia;
  weekday: number;
  ora: number;
}) {
  const db = getDb();
  const existing = db
    .prepare(
      `SELECT id FROM disponibilita_ore
       WHERE user_id = ? AND sede_id = ? AND fascia = ? AND weekday = ? AND ora = ?`
    )
    .get(
      input.userId,
      input.sedeId,
      input.fascia,
      input.weekday,
      input.ora
    ) as { id: number } | undefined;
  if (existing) {
    db.prepare(`DELETE FROM disponibilita_ore WHERE id = ?`).run(existing.id);
    return false;
  }
  db.prepare(
    `INSERT INTO disponibilita_ore (user_id, sede_id, fascia, weekday, ora)
     VALUES (?, ?, ?, ?, ?)`
  ).run(input.userId, input.sedeId, input.fascia, input.weekday, input.ora);
  return true;
}
