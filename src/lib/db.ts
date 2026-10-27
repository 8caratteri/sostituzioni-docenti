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
      role TEXT NOT NULL CHECK(role IN ('segreteria','dirigente','docente')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budget (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total_eur REAL NOT NULL,
      tariff_eur REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS classi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sedi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS disponibilita (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id)
    );

    CREATE TABLE IF NOT EXISTS slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
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
      assigned_by TEXT NOT NULL REFERENCES users(id),
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      confirm_deadline TEXT,
      responded_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_assignments_slot ON assignments(slot_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_docente ON assignments(docente_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
    CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date);
    CREATE INDEX IF NOT EXISTS idx_slots_visa ON slots(visa_status);
  `);
}

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
      id: "dirigente-demo",
      email: "dirigente@demo.local",
      name: "Dirigente Demo",
      role: "dirigente",
    },
    {
      id: "maria-rossi",
      email: "maria.rossi@demo.local",
      name: "Maria Rossi",
      role: "docente",
    },
    {
      id: "luca-bianchi",
      email: "luca.bianchi@demo.local",
      name: "Luca Bianchi",
      role: "docente",
    },
    {
      id: "anna-verdi",
      email: "anna.verdi@demo.local",
      name: "Anna Verdi",
      role: "docente",
    },
  ];

  const tx = db.transaction(() => {
    for (const u of users) insertUser.run(u);

    db.prepare(
      `INSERT INTO budget (id, total_eur, tariff_eur) VALUES (1, 5000, 35)`
    ).run();

    const classi = ["A1", "A2", "B1", "B2", "Centrale"];
    const sedi = ["Sede centrale", "Plesso nord", "Plesso sud"];
    const insC = db.prepare(`INSERT INTO classi (name) VALUES (?)`);
    const insS = db.prepare(`INSERT INTO sedi (name) VALUES (?)`);
    for (const c of classi) insC.run(c);
    for (const s of sedi) insS.run(s);

    db.prepare(
      `INSERT INTO disponibilita (user_id, label) VALUES (?, ?)`
    ).run("maria-rossi", "Mattina · sedi centrali");
    db.prepare(
      `INSERT INTO disponibilita (user_id, label) VALUES (?, ?)`
    ).run("luca-bianchi", "Pomeriggio");
  });

  tx();
}

export function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  _db = new Database(dbPath);
  ensureSchema(_db);
  seedIfEmpty(_db);
  return _db;
}

export function getDbPath() {
  return dbPath;
}
