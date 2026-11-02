import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "sostituzioni.sqlite");

let _db: Database.Database | null = null;

function ensureSchema(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('segreteria','vicepreside','dirigente','docente')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budget (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total_eur REAL NOT NULL,
      tariff_eur REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sedi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      fascia_default TEXT NOT NULL DEFAULT 'mattina'
        CHECK(fascia_default IN ('mattina','pomeriggio','mista')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS classi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sede_id INTEGER NOT NULL REFERENCES sedi(id) ON DELETE CASCADE,
      fascia TEXT NOT NULL CHECK(fascia IN ('mattina','pomeriggio')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(sede_id, name)
    );

    CREATE TABLE IF NOT EXISTS disponibilita_ore (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sede_id INTEGER NOT NULL REFERENCES sedi(id) ON DELETE CASCADE,
      fascia TEXT NOT NULL CHECK(fascia IN ('mattina','pomeriggio')),
      weekday INTEGER NOT NULL CHECK(weekday BETWEEN 1 AND 5),
      ora INTEGER NOT NULL CHECK(ora BETWEEN 1 AND 5),
      UNIQUE(user_id, sede_id, fascia, weekday, ora)
    );

    CREATE TABLE IF NOT EXISTS recuperi (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      ore REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      ora INTEGER NOT NULL DEFAULT 1,
      fascia TEXT NOT NULL DEFAULT 'mattina'
        CHECK(fascia IN ('mattina','pomeriggio')),
      classe_id INTEGER REFERENCES classi(id) ON DELETE SET NULL,
      sede_id INTEGER REFERENCES sedi(id) ON DELETE SET NULL,
      classe_name TEXT,
      sede_name TEXT,
      note TEXT,
      motivo TEXT,
      importo_eur REAL NOT NULL,
      visa_status TEXT NOT NULL CHECK(visa_status IN ('awaiting','approved','rejected')),
      visa_note TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_role TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_id INTEGER NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
      docente_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL CHECK(status IN ('pending','confirmed','refused','expired','cancelled')),
      is_ufficio INTEGER NOT NULL DEFAULT 0,
      is_recupero INTEGER NOT NULL DEFAULT 0,
      refuse_motivo TEXT,
      assigned_by TEXT NOT NULL REFERENCES users(id),
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      confirm_deadline TEXT,
      responded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS proposte (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_id INTEGER NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
      docente_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','accepted','withdrawn','rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(slot_id, docente_id)
    );

    CREATE TABLE IF NOT EXISTS nav_seen (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      channel TEXT NOT NULL,
      seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, channel)
    );

    CREATE INDEX IF NOT EXISTS idx_assignments_slot ON assignments(slot_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_docente ON assignments(docente_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
    CREATE INDEX IF NOT EXISTS idx_proposte_slot ON proposte(slot_id);
    CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date);
    CREATE INDEX IF NOT EXISTS idx_slots_visa ON slots(visa_status);
    CREATE INDEX IF NOT EXISTS idx_disp_ore ON disponibilita_ore(sede_id, weekday, ora);
  `);
}

type Cell = [sede: string, fascia: "mattina" | "pomeriggio", weekday: number, ...ore: number[]];

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM users").get() as {
    c: number;
  };
  if (count.c > 0) return;

  const insertUser = db.prepare(
    `INSERT INTO users (id, email, name, role) VALUES (@id, @email, @name, @role)`
  );

  const users = [
    {
      id: "segreteria-demo",
      email: "segreteria@demo.local",
      name: "Segreteria Demo",
      role: "segreteria",
    },
    {
      id: "vicepreside-demo",
      email: "vicepreside@demo.local",
      name: "Vicepreside Demo",
      role: "vicepreside",
    },
    {
      id: "dirigente-demo",
      email: "dirigente@demo.local",
      name: "Dirigente Demo",
      role: "dirigente",
    },
    { id: "moschetti", email: "moschetti@demo.local", name: "Moschetti", role: "docente" },
    {
      id: "tranchinetti",
      email: "tranchinetti@demo.local",
      name: "Tranchinetti",
      role: "docente",
    },
    { id: "andreani", email: "andreani@demo.local", name: "Andreani", role: "docente" },
    { id: "rapallini", email: "rapallini@demo.local", name: "Rapallini", role: "docente" },
    { id: "stangalino", email: "stangalino@demo.local", name: "Stangalino", role: "docente" },
    { id: "del-nero", email: "del.nero@demo.local", name: "Del Nero", role: "docente" },
  ];

  const disp: Record<string, Cell[]> = {
    moschetti: [
      ["Carrara", "mattina", 1, 3, 4, 5],
      ["Carrara", "mattina", 2, 2, 3],
      ["Carrara", "mattina", 3, 3, 4, 5],
      ["Carrara", "mattina", 4, 4, 5],
      ["Massa", "pomeriggio", 1, 1, 5],
      ["Massa", "pomeriggio", 2, 1, 2, 3],
      ["Massa", "pomeriggio", 3, 1, 5],
      ["Massa", "pomeriggio", 4, 1, 5],
      ["Massa", "pomeriggio", 5, 1, 5],
    ],
    tranchinetti: [
      ["Carrara", "mattina", 1, 3],
      ["Carrara", "mattina", 3, 3, 4, 5],
      ["Carrara", "mattina", 4, 3],
      ["Carrara", "mattina", 5, 1, 2, 3],
      ["Massa", "pomeriggio", 2, 1, 2],
      ["Massa", "pomeriggio", 4, 3, 4],
    ],
    andreani: [
      ["Massa", "pomeriggio", 1, 2, 3],
      ["Massa", "pomeriggio", 2, 2],
      ["Massa", "pomeriggio", 4, 1, 4],
    ],
    rapallini: [
      ["Carrara", "mattina", 1, 1, 2],
      ["Carrara", "mattina", 5, 2, 3, 4, 5],
      ["Aulla", "mattina", 4, 1, 2],
    ],
    stangalino: [
      ["Carrara", "mattina", 1, 5],
      ["Massa", "pomeriggio", 4, 4, 5],
      ["Aulla", "mattina", 3, 1, 2],
      ["Aulla", "pomeriggio", 3, 4, 5],
    ],
    "del-nero": [
      ["Carrara", "mattina", 1, 1, 2, 3, 4, 5],
      ["Carrara", "mattina", 2, 1, 2, 3, 4, 5],
      ["Carrara", "mattina", 3, 1, 2, 3],
      ["Carrara", "mattina", 5, 1, 4],
      ["Massa", "pomeriggio", 1, 3, 5],
      ["Massa", "pomeriggio", 2, 3, 4, 5],
      ["Massa", "pomeriggio", 3, 1, 2, 3, 4, 5],
      ["Massa", "pomeriggio", 4, 1, 2, 3, 4, 5],
      ["Massa", "pomeriggio", 5, 1, 2, 3, 4, 5],
    ],
  };

  const recuperiSeed: Record<string, number> = {
    moschetti: 2,
    tranchinetti: 0,
    andreani: 1,
    rapallini: 0,
    stangalino: 3,
    "del-nero": 0,
  };

  const tx = db.transaction(() => {
    for (const u of users) insertUser.run(u);

    db.prepare(
      `INSERT INTO budget (id, total_eur, tariff_eur) VALUES (1, 5000, 35)`
    ).run();

    const insSede = db.prepare(
      `INSERT INTO sedi (name, fascia_default) VALUES (?, ?)`
    );
    insSede.run("Carrara", "mattina");
    insSede.run("Massa", "pomeriggio");
    insSede.run("Aulla", "mista");

    const sedeId = (name: string) =>
      (
        db.prepare(`SELECT id FROM sedi WHERE name = ?`).get(name) as {
          id: number;
        }
      ).id;

    const insClasse = db.prepare(
      `INSERT INTO classi (name, sede_id, fascia) VALUES (?, ?, ?)`
    );
    insClasse.run("Mattina", sedeId("Carrara"), "mattina");
    insClasse.run("Pomeriggio", sedeId("Massa"), "pomeriggio");
    insClasse.run("Mattina", sedeId("Aulla"), "mattina");
    insClasse.run("Pomeriggio", sedeId("Aulla"), "pomeriggio");

    const insDisp = db.prepare(
      `INSERT OR IGNORE INTO disponibilita_ore (user_id, sede_id, fascia, weekday, ora)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const [uid, cells] of Object.entries(disp)) {
      for (const [sede, fascia, weekday, ...ore] of cells) {
        const sid = sedeId(sede);
        for (const ora of ore) {
          insDisp.run(uid, sid, fascia, weekday, ora);
        }
      }
    }

    const insRec = db.prepare(
      `INSERT INTO recuperi (user_id, ore) VALUES (?, ?)`
    );
    for (const [uid, ore] of Object.entries(recuperiSeed)) {
      insRec.run(uid, ore);
    }
  });

  tx();
}

/** Migrazioni leggere se DB vecchio / incompleto. */
function migrate(db: Database.Database) {
  const userCols = db.prepare(`PRAGMA table_info(users)`).all() as {
    name: string;
  }[];
  // Se lo schema vecchio senza vicepreside, ricostruiamo da zero in demo.
  const hasVice = db
    .prepare(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`
    )
    .get() as { sql: string } | undefined;
  if (hasVice?.sql && !hasVice.sql.includes("vicepreside")) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      DROP TABLE IF EXISTS nav_seen;
      DROP TABLE IF EXISTS proposte;
      DROP TABLE IF EXISTS assignments;
      DROP TABLE IF EXISTS slots;
      DROP TABLE IF EXISTS recuperi;
      DROP TABLE IF EXISTS disponibilita_ore;
      DROP TABLE IF EXISTS disponibilita;
      DROP TABLE IF EXISTS classi;
      DROP TABLE IF EXISTS sedi;
      DROP TABLE IF EXISTS budget;
      DROP TABLE IF EXISTS users;
      PRAGMA foreign_keys = ON;
    `);
    ensureSchema(db);
    seedIfEmpty(db);
    return;
  }

  void userCols;
  const tables = (
    db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      )
      .all() as { name: string }[]
  ).map((t) => t.name);
  if (!tables.includes("disponibilita_ore")) {
    ensureSchema(db);
  }
  if (!tables.includes("proposte")) ensureSchema(db);
  if (!tables.includes("recuperi")) ensureSchema(db);
  if (!tables.includes("nav_seen")) ensureSchema(db);

  // Align nav_seen column name if agent created "section"
  try {
    const cols = db.prepare(`PRAGMA table_info(nav_seen)`).all() as {
      name: string;
    }[];
    if (cols.some((c) => c.name === "section") && !cols.some((c) => c.name === "channel")) {
      db.exec(`ALTER TABLE nav_seen RENAME COLUMN section TO channel`);
    }
  } catch {
    /* ignore */
  }
}

export function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  _db = new Database(dbPath);
  ensureSchema(_db);
  migrate(_db);
  seedIfEmpty(_db);
  return _db;
}

export function getDbPath() {
  return dbPath;
}

export function resetDbForDemo() {
  if (_db) {
    _db.close();
    _db = null;
  }
  for (const ext of ["", "-wal", "-shm"]) {
    const p = dbPath + ext;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}
