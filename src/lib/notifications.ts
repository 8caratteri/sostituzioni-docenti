import { getDb } from "./db";
import type { Role } from "./types";

export type NavChannel = "elenco" | "mie-ore";

function ensureNavSeenTable() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS nav_seen (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      channel TEXT NOT NULL,
      seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, channel)
    );
  `);
}

export function getNavSeenAt(userId: string, channel: NavChannel): string {
  ensureNavSeenTable();
  const row = getDb()
    .prepare(
      `SELECT seen_at FROM nav_seen WHERE user_id = ? AND channel = ?`
    )
    .get(userId, channel) as { seen_at: string } | undefined;
  return row?.seen_at ?? "1970-01-01T00:00:00";
}

export function markNavSeen(userId: string, channel: NavChannel) {
  ensureNavSeenTable();
  getDb()
    .prepare(
      `INSERT INTO nav_seen (user_id, channel, seen_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id, channel) DO UPDATE SET seen_at = datetime('now')`
    )
    .run(userId, channel);
}

export type NavBadges = { elenco: number; mieOre: number };

export function getNavBadges(userId: string, role: Role): NavBadges {
  ensureNavSeenTable();
  const db = getDb();
  const elencoSeen = getNavSeenAt(userId, "elenco");
  let elenco = 0;
  let mieOre = 0;

  if (role === "vicepreside") {
    const refusals = db
      .prepare(
        `SELECT COUNT(*) AS c FROM assignments
         WHERE status = 'refused' AND responded_at IS NOT NULL AND responded_at > ?`
      )
      .get(elencoSeen) as { c: number };
    const proposte = db
      .prepare(
        `SELECT COUNT(*) AS c FROM proposte WHERE status = 'pending' AND created_at > ?`
      )
      .get(elencoSeen) as { c: number };
    elenco = (refusals?.c ?? 0) + (proposte?.c ?? 0);
  }

  if (role === "dirigente") {
    const visti = db
      .prepare(`SELECT COUNT(*) AS c FROM slots WHERE visa_status = 'awaiting'`)
      .get() as { c: number };
    elenco = visti?.c ?? 0;
  }

  if (role === "docente") {
    const accetta = db
      .prepare(
        `SELECT COUNT(*) AS c
         FROM assignments a
         JOIN slots s ON s.id = a.slot_id
         WHERE a.docente_id = ?
           AND a.status = 'pending'
           AND a.is_ufficio = 0
           AND s.visa_status = 'approved'`
      )
      .get(userId) as { c: number };
    mieOre = accetta?.c ?? 0;
  }

  return { elenco, mieOre };
}

/** Badge Elenco per staff (vicepreside / dirigente). */
export function navBadgeFor(role: Role, userId: string): number {
  return getNavBadges(userId, role).elenco;
}

/** Badge «Le mie ore» per docente (da Accettare). */
export function countDocenteBadge(userId: string): number {
  return getNavBadges(userId, "docente").mieOre;
}
