import { auth } from "@/lib/auth";
import { actionTeacherPropose } from "@/app/actions";
import { formatTimeRange } from "@/lib/format";
import {
  listAvailableTeachers,
  listOpenSlotsForTeachers,
} from "@/lib/slots";

export default async function SlotApertiPage() {
  const session = await auth();
  const open = listOpenSlotsForTeachers();
  const available = listAvailableTeachers();
  const canPropose = available.some((t) => t.id === session!.user!.id);

  return (
    <>
      <h1>Slot aperti</h1>
      <p className="muted small">
        Puoi proporti sugli slot liberi già vistati. Non vedi gli importi in
        euro.
      </p>

      {!canPropose && (
        <p className="muted">
          Non risulti nell&apos;elenco disponibilità: chiedi alla segreteria di
          aggiungerti.
        </p>
      )}

      {open.length === 0 && <p className="muted">Nessuno slot aperto.</p>}

      <div className="list-stack">
        {open.map((s) => (
          <div key={s.id} className="card row-between">
            <div>
              <div style={{ fontWeight: 650 }}>
                {s.date} · {formatTimeRange(s.start_time, s.end_time)} ·{" "}
                {s.classe_name || "—"} · {s.sede_name || "—"}
              </div>
              {s.motivo && <div className="muted small">{s.motivo}</div>}
            </div>
            {canPropose && (
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
