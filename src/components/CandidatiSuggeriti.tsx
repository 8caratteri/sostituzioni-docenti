"use client";

import type { Candidato } from "@/lib/types";

export function CandidatiSuggeriti({
  candidati,
  value,
  onChange,
  narrow,
  emptyLabel = "Nessun docente disponibile per questo plesso, fascia e orario.",
}: {
  candidati: Candidato[];
  value: string;
  onChange: (id: string) => void;
  narrow?: boolean;
  emptyLabel?: string;
}) {
  if (candidati.length === 0) {
    return <p className="candidati-empty">{emptyLabel}</p>;
  }

  return (
    <div className={`candidati-pick ${narrow ? "is-narrow" : ""}`}>
      <input type="hidden" name="docente_id" value={value} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Scegli docente"
      >
        <option value="">Scegli docente…</option>
        {candidati.map((c) => (
          <option key={c.id} value={c.id}>
            {c.priority ? "★ " : ""}
            {c.name}
            {c.priority ? ` · recupero ${c.ore_recupero}h` : ""}
            {!c.available ? " · fuori disp." : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
