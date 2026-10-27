import { auth } from "@/lib/auth";
import { actionTeacherRespond } from "@/app/actions";
import { formatTimeRange } from "@/lib/format";
import { listTeacherAssignments } from "@/lib/slots";

export default async function DocentePage() {
  const session = await auth();
  const rows = listTeacherAssignments(session!.user!.id);

  const pending = rows.filter((r) => r.status === "pending");
  const confirmed = rows.filter((r) => r.status === "confirmed");
  const past = rows.filter(
    (r) => !["pending", "confirmed"].includes(r.status)
  );

  return (
    <>
      <h1>Le mie ore</h1>
      <p className="page-lead">
        Accetta entro 2 ore prima dell&apos;inizio. Se non accetti in tempo,
        l&apos;assegnazione scade e lo slot torna libero.
      </p>

      <h2>Da confermare</h2>
      {pending.length === 0 && (
        <p className="muted">Nessuna proposta in attesa.</p>
      )}
      <div className="list-stack">
        {pending.map((r) => (
          <div key={r.id} className="card">
            <div style={{ fontWeight: 650 }}>
              {r.date} · {formatTimeRange(r.start_time, r.end_time)} ·{" "}
              {r.classe_name || "—"} · {r.sede_name || "—"}
            </div>
            {r.confirm_deadline && (
              <div className="muted small">
                Scade {new Date(r.confirm_deadline).toLocaleString("it-IT")}
              </div>
            )}
            {r.is_ufficio ? (
              <p className="small">Assegnazione d&apos;ufficio (già confermata).</p>
            ) : (
              <form action={actionTeacherRespond} className="form-actions">
                <input type="hidden" name="assignment_id" value={r.id} />
                <button
                  type="submit"
                  name="decision"
                  value="accept"
                  className="btn-primary"
                >
                  Accetta
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="refuse"
                  className="btn-danger"
                >
                  Rifiuta
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      <h2>Confermate</h2>
      {confirmed.length === 0 && (
        <p className="muted">Nessuna ora confermata.</p>
      )}
      <div className="list-stack">
        {confirmed.map((r) => (
          <div key={r.id} className="card">
            <div style={{ fontWeight: 650 }}>
              {r.date} · {formatTimeRange(r.start_time, r.end_time)} ·{" "}
              {r.classe_name || "—"} · {r.sede_name || "—"}
            </div>
            <div style={{ marginTop: "0.35rem" }}>
              <span className="badge badge-ok">
                {r.is_ufficio ? "Confermato (d’ufficio)" : "Confermato"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {past.length > 0 && (
        <>
          <h2>Storico</h2>
          <div className="list-stack">
            {past.map((r) => (
              <div key={r.id} className="card">
                <div>
                  {r.date} · {formatTimeRange(r.start_time, r.end_time)} ·{" "}
                  {r.classe_name || "—"}
                </div>
                <div className="muted small" style={{ marginTop: "0.25rem" }}>
                  {r.status === "refused"
                    ? "Rifiutato"
                    : r.status === "expired"
                      ? "Scaduto"
                      : "Annullato"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
