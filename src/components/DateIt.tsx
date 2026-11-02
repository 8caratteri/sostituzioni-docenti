import { formatDateItParts } from "@/lib/format";

export function DateIt({ date }: { date: string }) {
  const { weekday, day } = formatDateItParts(date);
  return (
    <time dateTime={date} className="date-it">
      {weekday ? <span className="date-wd">{weekday}</span> : null}
      <span className="date-num">{day}</span>
    </time>
  );
}
