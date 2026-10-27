import { SlotActions } from "@/components/SlotActions";
import { AssignmentBadge, VisaBadge } from "@/components/StatusBadges";
import { formatEuro, formatTimeRange } from "@/lib/format";
import { groupSlotsByMonth } from "@/lib/group";
import { listAvailableTeachers, listSlots } from "@/lib/slots";

export default async function AdminSlotsPage() {
  const slots = listSlots();
  const teachers = listAvailableTeachers();
  const groups = groupSlotsByMonth(slots);

  return (
    <>
      <h1>Elenco slot</h1>
      <p className="page-lead">
        Gli slot creati dalla segreteria restano in attesa di visto. Dopo il
        visto puoi assegnare un docente disponibile. Assegna / Rimuovi fino a 10
        minuti prima; se assegni a meno di 2 ore dall&apos;inizio è
        d&apos;ufficio (già confermato).
      </p>

      {groups.length === 0 && (
        <p className="empty-state">Nessuno slot ancora. Crea un nuovo slot.</p>
      )}

      {groups.map((g) => (
        <section key={g.key} className="month-group">
          <h2 className="month-title">{g.label}</h2>
          <table className="slot-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Ora</th>
                <th>Classe</th>
                <th>Sede</th>
                <th>€</th>
                <th>Visto</th>
                <th>Stato</th>
                <th>Docente</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {g.slots.map((s) => (
                <tr key={s.id}>
                  <td>{s.date}</td>
                  <td>{formatTimeRange(s.start_time, s.end_time)}</td>
                  <td>
                    {s.classe_name || "—"}
                    {s.note ? <span className="note-sub">{s.note}</span> : null}
                  </td>
                  <td>{s.sede_name || "—"}</td>
                  <td>{formatEuro(s.importo_eur)}</td>
                  <td>
                    <VisaBadge status={s.visa_status} />
                  </td>
                  <td>
                    <AssignmentBadge
                      status={s.assignment_status}
                      isUfficio={s.is_ufficio}
                    />
                  </td>
                  <td>{s.docente_name || "—"}</td>
                  <td>
                    <SlotActions slot={s} teachers={teachers} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}
