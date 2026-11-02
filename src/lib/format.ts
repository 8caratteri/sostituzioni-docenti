import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

export function formatEuro(value: number): string {
  return (
    new Intl.NumberFormat("it-IT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + " €"
  );
}

export function formatDateIt(date: string): string {
  try {
    return format(parseISO(date.includes("T") ? date : date + "T12:00:00"), "dd/MM/yyyy");
  } catch {
    return date;
  }
}

/** Es. «lun 03/11/2026» — giorno settimana corto + data italiana. */
export function formatDateItWithWeekday(date: string): string {
  const { weekday, day } = formatDateItParts(date);
  return weekday ? `${weekday} ${day}` : day;
}

/** Parti separate per UI (giorno settimana piccolo + data). */
export function formatDateItParts(date: string): {
  weekday: string;
  day: string;
} {
  try {
    const d = parseISO(date.includes("T") ? date : date + "T12:00:00");
    const weekday = format(d, "EEE", { locale: it }).replace(/\.$/, "");
    const day = format(d, "dd/MM/yyyy");
    return { weekday, day };
  } catch {
    return { weekday: "", day: date };
  }
}

/** Etichetta ora slot: «3ª ora» (+ eventuale contesto). */
export function formatSlotOra(
  startTime: string,
  sedeName?: string | null,
  classeName?: string | null,
  ora?: number | null
): string {
  void sedeName;
  void classeName;
  if (ora && ora >= 1 && ora <= 5) return `${ora}ª ora`;
  return startTime.slice(0, 5);
}

export function formatMonthYear(date: string): string {
  try {
    const label = format(parseISO(date + "T12:00:00"), "LLLL yyyy", {
      locale: it,
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return date.slice(0, 7);
  }
}

export function formatTimeRange(start: string, end: string): string {
  return `${start.slice(0, 5)}–${end.slice(0, 5)}`;
}

export function slotStartDate(date: string, startTime: string): Date {
  return new Date(`${date}T${startTime.slice(0, 5)}:00`);
}

export function hoursBefore(date: Date, hours: number): Date {
  return new Date(date.getTime() - hours * 60 * 60 * 1000);
}

export function minutesBefore(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

export function formatDateTimeIt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("it-IT");
  } catch {
    return iso;
  }
}
