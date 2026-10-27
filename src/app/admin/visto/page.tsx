import Link from "next/link";
import { redirect } from "next/navigation";
import { actionVisa } from "@/app/actions";
import { auth } from "@/lib/auth";
import { formatEuro, formatTimeRange } from "@/lib/format";
import { listAwaitingVisa } from "@/lib/slots";

export default async function VistoPage() {
  const session = await auth();
  if (session?.user?.role !== "dirigente") redirect("/admin");

  const awaiting = listAwaitingVisa();

  return (
    <>
      <div className="row-between">
        <h1>Da vistare</h1>
        <Link href="/admin">Torna all&apos;elenco</Link>
      </div>
      <p className="muted small">
        Approva o rifiuta gli slot creati dalla segreteria. Solo dopo il visto
        si può assegnare un docente.
      </p>

      {awaiting.length === 0 && (
        <p className="muted">Nessuno slot in attesa di visto.</p>
      )}

      <div className="list-stack">
        {awaiting.map((s) => (
          <div key={s.id} className="card">
            <div style={{ fontWeight: 650 }}>
              {s.date} · {formatTimeRange(s.start_time, s.end_time)} ·{" "}
              {s.classe_name || "—"} · {s.sede_name || "—"}
            </div>
            <div className="muted small" style={{ marginTop: "0.25rem" }}>
              {formatEuro(s.importo_eur)} · creato da {s.creator_name}
              {s.motivo ? ` · ${s.motivo}` : ""}
            </div>
            <div style={{ marginTop: "0.45rem" }}>
              <span className="badge badge-warn">In attesa di visto</span>
            </div>

            <form action={actionVisa} style={{ marginTop: "0.75rem" }}>
              <input type="hidden" name="slot_id" value={s.id} />
              <label className="small" style={{ display: "grid", gap: "0.25rem" }}>
                Nota (facoltativa)
                <input
                  type="text"
                  name="note"
                  placeholder="Motivo del rifiuto…"
                />
              </label>
              <div className="form-actions">
                <button
                  type="submit"
                  name="decision"
                  value="approved"
                  className="btn-primary"
                >
                  Vista / Approva
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="rejected"
                  className="btn-danger"
                >
                  Rifiuta visto
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
