"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actionCreateSlot } from "@/app/actions";
import { MonthCalendar } from "./MonthCalendar";
import { ORE_DIDATTICHE } from "@/lib/slot-time";

type Sede = { id: number; name: string };
type Classe = { id: number; name: string; sede_id: number; fascia: string };

export function NuovoSlotForm({
  sedi,
  classi,
}: {
  sedi: Sede[];
  classi: Classe[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [sedeId, setSedeId] = useState("");
  const [classeId, setClasseId] = useState("");
  const [ora, setOra] = useState("");

  const classiForSede = useMemo(() => {
    if (!sedeId) return [];
    return classi.filter((c) => String(c.sede_id) === sedeId);
  }, [classi, sedeId]);

  useEffect(() => {
    if (classiForSede.length === 1) {
      setClasseId(String(classiForSede[0].id));
    }
  }, [classiForSede]);

  return (
    <div className="nuovo-layout">
      <MonthCalendar value={date} onSelect={setDate} />
      <form
        className="nuovo-form"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("date", date);
          start(async () => {
            try {
              await actionCreateSlot(fd);
              router.push("/admin");
              router.refresh();
            } catch (err) {
              alert(err instanceof Error ? err.message : "Errore");
            }
          });
        }}
      >
        <input type="hidden" name="date" value={date} />
        <label>
          Data
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="form-row-2">
          <label>
            Plesso
            <select
              name="sede_id"
              required
              value={sedeId}
              onChange={(e) => {
                setSedeId(e.target.value);
                setClasseId("");
              }}
            >
              <option value="">—</option>
              {sedi.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Classe
            <select
              name="classe_id"
              required
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              disabled={!sedeId}
            >
              <option value="">—</option>
              {classiForSede.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Ora didattica
          <select
            name="ora"
            required
            value={ora}
            onChange={(e) => setOra(e.target.value)}
          >
            <option value="">—</option>
            {ORE_DIDATTICHE.map((o) => (
              <option key={o} value={o}>
                {o}ª ora
              </option>
            ))}
          </select>
        </label>
        <label>
          Motivo
          <input type="text" name="motivo" placeholder="Opzionale" />
        </label>
        <label>
          Note
          <input type="text" name="note" placeholder="Opzionale" />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={pending}>
            Crea slot
          </button>
        </div>
      </form>
    </div>
  );
}
