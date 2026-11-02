import { auth } from "@/lib/auth";
import { actionTeacherPropose } from "@/app/actions";
import { DateIt } from "@/components/DateIt";
import { getDb } from "@/lib/db";
import { formatTimeRange } from "@/lib/format";
import { labelOra } from "@/lib/slot-time";
import { listOpenSlotsForTeachers } from "@/lib/slots";

export default async function SlotApertiPage() {
  const session = await auth();
  const docenteId = session!.user!.id;
  const open = listOpenSlotsForTeachers(docenteId);

  const already = new Set(
    (
      getDb()
        .prepare(
          `SELECT slot_id FROM proposte
           WHERE docente_id = ? AND status = 'pending'`
        )
        .all(docenteId) as { slot_id: number }[]
    ).map((r) => r.slot_id)
  );

  return (
    <>
      <h1>Slot aperti</h1>
      <p className="page-lead">
        Puoi proporti sugli slot liberi in cui risulti disponibile. La
        vicepreside accetta la proposta; poi serve il visto del dirigente.
      </p>

      {open.length === 0 && (
        <p className="muted">
          Nessuno slot aperto in cui risulti disponibile.
        </p>
      )}

      <div className="list-stack">
        {open.map((s) => (
          <div key={s.id} className="card row-between">
            <div>
              <div style={{ fontWeight: 650 }}>
                <DateIt date={s.date} /> · {labelOra(s.ora)} (
                {formatTimeRange(s.start_time, s.end_time)}) ·{" "}
                {s.classe_name || "—"} · {s.sede_name || "—"}
              </div>
              {s.motivo && <div className="muted small">{s.motivo}</div>}
              {s.visa_status === "awaiting" && (
                <div className="muted tiny">In attesa di visto</div>
              )}
            </div>
            {already.has(s.id) ? (
              <span className="badge badge-warn">Proposta inviata</span>
            ) : (
              <form action={actionTeacherPropose}>
                <input type="hidden" name="slot_id" value={s.id} />
                <button type="submit" className="btn-primary">
                  Proporsi
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
