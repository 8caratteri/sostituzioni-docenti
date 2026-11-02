"use client";

import { useMemo, useState } from "react";

function toIso(y: number, m0: number, d: number) {
  const mm = String(m0 + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

export function MonthCalendar({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (iso: string) => void;
}) {
  const initial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [cursor, setCursor] = useState(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1)
  );

  const title = cursor.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  const cells = useMemo(() => {
    const y = cursor.getFullYear();
    const m0 = cursor.getMonth();
    const firstDow = (new Date(y, m0, 1).getDay() + 6) % 7; // lun=0
    const daysInMonth = new Date(y, m0 + 1, 0).getDate();
    const out: { iso: string | null; label: number | null; today: boolean }[] =
      [];
    for (let i = 0; i < firstDow; i++) out.push({ iso: null, label: null, today: false });
    const todayIso = toIso(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    );
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toIso(y, m0, d);
      out.push({ iso, label: d, today: iso === todayIso });
    }
    while (out.length % 7 !== 0) out.push({ iso: null, label: null, today: false });
    return out;
  }, [cursor]);

  return (
    <div className="month-cal">
      <div className="month-cal-head">
        <button
          type="button"
          className="month-cal-nav"
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
          }
        >
          ‹
        </button>
        <div className="month-cal-title">
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </div>
        <button
          type="button"
          className="month-cal-nav"
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
          }
        >
          ›
        </button>
      </div>
      <div className="month-cal-weekdays">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((w) => (
          <div key={w} className="month-cal-wd">
            {w}
          </div>
        ))}
      </div>
      <div className="month-cal-grid">
        {cells.map((c, i) =>
          c.iso ? (
            <button
              key={i}
              type="button"
              className={`month-cal-day ${c.today ? "is-today" : ""} ${
                c.iso === value ? "is-selected" : ""
              }`}
              onClick={() => onSelect(c.iso!)}
            >
              {c.label}
            </button>
          ) : (
            <div key={i} className="month-cal-day is-empty" />
          )
        )}
      </div>
    </div>
  );
}
