"use client";

import { useMemo, useState, useTransition } from "react";
import { actionSetRecupero, actionToggleDisponibilita } from "@/app/actions";
import { ORE_DIDATTICHE, WEEKDAY_LABELS } from "@/lib/slot-time";
import type { Fascia } from "@/lib/types";

type Teacher = { id: string; name: string; ore_recupero: number };
type Sede = { id: number; name: string; fascia_default: string };
type Cell = {
  user_id: string;
  sede_id: number;
  fascia: Fascia;
  weekday: number;
  ora: number;
};

export function DisponibilitaEditor({
  teachers,
  sedi,
  cells,
}: {
  teachers: Teacher[];
  sedi: Sede[];
  cells: Cell[];
}) {
  const [pending, start] = useTransition();
  const [userId, setUserId] = useState(teachers[0]?.id || "");
  const [ore, setOre] = useState(
    () => teachers.find((t) => t.id === userId)?.ore_recupero ?? 0
  );

  const mine = useMemo(
    () => new Set(
      cells
        .filter((c) => c.user_id === userId)
        .map((c) => `${c.sede_id}|${c.fascia}|${c.weekday}|${c.ora}`)
    ),
    [cells, userId]
  );

  if (teachers.length === 0) {
    return <p className="muted">Nessun docente in anagrafica.</p>;
  }

  return (
    <div className="disp-editor">
      <div className="disp-toolbar">
        <label>
          Docente
          <select
            value={userId}
            onChange={(e) => {
              const id = e.target.value;
              setUserId(id);
              setOre(teachers.find((t) => t.id === id)?.ore_recupero ?? 0);
            }}
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <form
          className="disp-recupero"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              await actionSetRecupero(fd);
            });
          }}
        >
          <input type="hidden" name="user_id" value={userId} />
          <label>
            Ore recupero
            <input
              type="number"
              name="ore_recupero"
              min={0}
              step={0.5}
              value={ore}
              onChange={(e) => setOre(Number(e.target.value))}
            />
          </label>
          <button type="submit" className="btn-secondary" disabled={pending}>
            Salva
          </button>
        </form>
      </div>

      <div className="disp-strips">
        {sedi.flatMap((sede) => {
          const fasce: Fascia[] =
            sede.fascia_default === "mista"
              ? ["mattina", "pomeriggio"]
              : [sede.fascia_default as Fascia];
          return fasce.map((fascia) => (
            <div key={`${sede.id}-${fascia}`} className="disp-strip">
              <div className="disp-strip-title">
                {sede.name} · {fascia}
              </div>
              <div className="disp-strip-grid">
                {[1, 2, 3, 4, 5].map((wd) => (
                  <div key={wd} className="disp-day">
                    <div className="disp-day-label">{WEEKDAY_LABELS[wd]}</div>
                    <div className="disp-ores">
                      {ORE_DIDATTICHE.map((ora) => {
                        const key = `${sede.id}|${fascia}|${wd}|${ora}`;
                        const on = mine.has(key);
                        return (
                          <button
                            key={ora}
                            type="button"
                            className={`disp-cell ${on ? "is-on" : ""}`}
                            disabled={pending}
                            title={`${WEEKDAY_LABELS[wd]} ${ora}ª`}
                            onClick={() => {
                              const fd = new FormData();
                              fd.set("user_id", userId);
                              fd.set("sede_id", String(sede.id));
                              fd.set("fascia", fascia);
                              fd.set("weekday", String(wd));
                              fd.set("ora", String(ora));
                              start(async () => {
                                await actionToggleDisponibilita(fd);
                              });
                            }}
                          >
                            {ora}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ));
        })}
      </div>
    </div>
  );
}
