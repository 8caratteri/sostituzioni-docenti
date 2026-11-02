import type { Fascia, OraDidattica } from "./types";

/** Orari di lezione (1ª–5ª) per fascia. */
const MATTINA: Record<OraDidattica, { start: string; end: string }> = {
  1: { start: "08:00", end: "09:00" },
  2: { start: "09:00", end: "10:00" },
  3: { start: "10:00", end: "11:00" },
  4: { start: "11:00", end: "12:00" },
  5: { start: "12:00", end: "13:00" },
};

const POMERIGGIO: Record<OraDidattica, { start: string; end: string }> = {
  1: { start: "14:00", end: "15:00" },
  2: { start: "15:00", end: "16:00" },
  3: { start: "16:00", end: "17:00" },
  4: { start: "17:00", end: "18:00" },
  5: { start: "18:00", end: "19:00" },
};

export function clockForOra(
  fascia: Fascia,
  ora: number
): { start: string; end: string } {
  const o = ora as OraDidattica;
  if (ora < 1 || ora > 5) {
    throw new Error("Ora didattica non valida (1–5)");
  }
  return fascia === "mattina" ? MATTINA[o] : POMERIGGIO[o];
}

export function labelOra(ora: number): string {
  return `${ora}ª ora`;
}

/** Lunedì=1 … Venerdì=5. Sabato/domenica → null. */
export function weekdayFromDate(dateIso: string): number | null {
  const d = new Date(`${dateIso}T12:00:00`);
  const js = d.getDay(); // 0=dom … 6=sab
  if (js === 0 || js === 6) return null;
  return js; // 1=lun … 5=ven
}

export const WEEKDAY_LABELS = [
  "",
  "Lun",
  "Mar",
  "Mer",
  "Gio",
  "Ven",
] as const;

export const ORE_DIDATTICHE = [1, 2, 3, 4, 5] as const;
