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
    return format(parseISO(date), "dd/MM/yyyy");
  } catch {
    return date;
  }
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
