import { auth } from "@/lib/auth";
import { DateIt } from "@/components/DateIt";
import { MarkNavSeen } from "@/components/MarkNavSeen";
import { TeacherRespondForm } from "@/components/TeacherRespondForm";
import { formatTimeRange } from "@/lib/format";
import { labelOra } from "@/lib/slot-time";
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
      <MarkNavSeen channel="mie-ore" />
      <h1>Le mie ore</h1>
      <p className="page-lead">
        Vedi subito le assegnazioni. Puoi Accettare o Rifiutare solo dopo il
        visto del dirigente, entro 2 ore prima dell&apos;inizio.
      </p>

      <h2>Da confermare</h2>
      {pending.length === 0 && (
        <p className="muted">Nessuna assegnazione in attesa.</p>
      )}
      <div className="list-stack">
        {pending.map((r) => {
          const waitingVisa = r.visa_status !== "approved";
          const canAccept =
            r.visa_status === "approved" && !r.is_ufficio;
          return (
            <div key={r.id} className="card">
              <div style={{ fontWeight: 650 }}>
                <DateIt date={r.date} /> · {labelOra(r.ora)} (
                {formatTimeRange(r.start_time, r.end_time)}) ·{" "}
                {r.classe_name || "—"} · {r.sede_name || "—"}
              </div>
              {r.is_recupero ? (
                <div className="muted small">Ora di recupero (0 €)</div>
              ) : null}
              {waitingVisa && (
                <div className="badge badge-warn" style={{ marginTop: "0.4rem" }}>
                  In attesa di visto
                </div>
              )}
              {r.confirm_deadline && canAccept && (
                <div className="muted small">
                  Scade {new Date(r.confirm_deadline).toLocaleString("it-IT")}
                </div>
              )}
              <TeacherRespondForm
                assignmentId={r.id}
                canAccept={canAccept}
                waitingVisa={waitingVisa}
              />
            </div>
          );
        })}
      </div>

      <h2>Confermate</h2>
      {confirmed.length === 0 && (
        <p className="muted">Nessuna ora confermata.</p>
      )}
      <div className="list-stack">
        {confirmed.map((r) => (
          <div key={r.id} className="card">
            <div style={{ fontWeight: 650 }}>
              <DateIt date={r.date} /> · {labelOra(r.ora)} ·{" "}
              {r.classe_name || "—"} · {r.sede_name || "—"}
            </div>
            <div style={{ marginTop: "0.35rem" }}>
              <span className="badge badge-ok">
                {r.is_ufficio ? "Confermato (d’ufficio)" : "Confermato"}
                {r.is_recupero ? " · recupero" : ""}
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
                  <DateIt date={r.date} /> · {labelOra(r.ora)} ·{" "}
                  {r.classe_name || "—"}
                </div>
                <div className="muted small" style={{ marginTop: "0.25rem" }}>
                  {r.status === "refused"
                    ? `Rifiutato${r.refuse_motivo ? `: ${r.refuse_motivo}` : ""}`
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
