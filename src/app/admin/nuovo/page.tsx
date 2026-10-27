import Link from "next/link";
import { actionCreateSlot } from "@/app/actions";
import { listClassi, listSedi } from "@/lib/catalog";
import { getBudget } from "@/lib/budget";

export default async function NuovoSlotPage() {
  const classi = listClassi();
  const sedi = listSedi();
  const budget = getBudget();

  return (
    <>
      <div className="row-between">
        <h1>Nuovo slot</h1>
        <Link href="/admin">Torna all&apos;elenco</Link>
      </div>
      <p className="muted small">
        Tariffa attuale: {budget.tariff_eur.toFixed(2).replace(".", ",")} €
        all&apos;ora (impostata in Budget e tariffe).
      </p>

      <form action={actionCreateSlot} className="card form-grid">
        <label>
          Data
          <input type="date" name="date" required />
        </label>
        <label>
          Ora inizio
          <input type="time" name="start_time" required defaultValue="08:00" />
        </label>
        <label>
          Ora fine
          <input type="time" name="end_time" required defaultValue="09:00" />
        </label>
        <label>
          Classe
          <select name="classe_id" defaultValue="">
            <option value="">—</option>
            {classi.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sede
          <select name="sede_id" defaultValue="">
            <option value="">—</option>
            {sedi.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Motivo (facoltativo)
          <input type="text" name="motivo" placeholder="Assenza, riunione…" />
        </label>
        <label>
          Nota (facoltativa)
          <input type="text" name="note" placeholder="Dettaglio…" />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Crea slot
          </button>
          <Link href="/admin" className="btn-secondary" style={{ display: "inline-block" }}>
            Annulla
          </Link>
        </div>
      </form>
    </>
  );
}
