import Link from "next/link";
import { actionUpdateBudget } from "@/app/actions";
import { getBudgetSummary } from "@/lib/budget";
import { formatEuro } from "@/lib/format";

export default async function BudgetPage() {
  const b = getBudgetSummary();

  return (
    <>
      <div className="row-between">
        <h1>Budget e tariffe</h1>
        <Link href="/admin">Torna all&apos;elenco</Link>
      </div>
      <p className="muted small">
        Il budget è un tetto in euro. Le assegnazioni in attesa o confermate
        impegnano l&apos;importo; se rifiutate o scadute, torna disponibile.
      </p>

      <div className="budget-grid" style={{ marginBottom: "1.25rem" }}>
        <div className="budget-stat">
          <div className="label">Totale</div>
          <div className="value">{formatEuro(b.totale)}</div>
        </div>
        <div className="budget-stat">
          <div className="label">Impegnato</div>
          <div className="value">{formatEuro(b.impegnato)}</div>
        </div>
        <div className="budget-stat">
          <div className="label">In attesa</div>
          <div className="value">{formatEuro(b.pending)}</div>
        </div>
        <div className="budget-stat">
          <div className="label">Dovuto (confermato)</div>
          <div className="value">{formatEuro(b.dovuto)}</div>
        </div>
        <div className="budget-stat">
          <div className="label">Residuo</div>
          <div className="value">{formatEuro(b.residuo)}</div>
        </div>
        <div className="budget-stat">
          <div className="label">Tariffa oraria</div>
          <div className="value">{formatEuro(b.tariffa)}</div>
        </div>
      </div>

      <form action={actionUpdateBudget} className="card form-grid">
        <label>
          Budget totale (€)
          <input
            type="number"
            name="total_eur"
            step="0.01"
            min="0"
            required
            defaultValue={b.totale}
          />
        </label>
        <label>
          Tariffa oraria (€)
          <input
            type="number"
            name="tariff_eur"
            step="0.01"
            min="0"
            required
            defaultValue={b.tariffa}
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Salva
          </button>
        </div>
      </form>
    </>
  );
}
