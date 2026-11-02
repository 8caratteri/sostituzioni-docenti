import Link from "next/link";
import { auth } from "@/lib/auth";
import { DateIt } from "@/components/DateIt";
import { MarkNavSeen } from "@/components/MarkNavSeen";
import { SlotActions } from "@/components/SlotActions";
import { AssignmentBadge, VisaBadge } from "@/components/StatusBadges";
import { VisaActions } from "@/components/VisaActions";
import { listCandidatiForSlot } from "@/lib/candidati";
import { formatEuro, formatTimeRange } from "@/lib/format";
import { groupSlotsByMonth } from "@/lib/group";
import { effectiveImporto } from "@/lib/pagamento";
import {
  canAssign,
  canCreateSlot,
  canVisa,
} from "@/lib/permissions";
import { listProposteForSlot } from "@/lib/proposte";
import { labelOra } from "@/lib/slot-time";
import { listSlots } from "@/lib/slots";

export default async function AdminSlotsPage() {
  const session = await auth();
  const role = session!.user!.role;
  const slots = listSlots();
  const groups = groupSlotsByMonth(slots);
  const showAssign = canAssign(role);
  const showCreate = canCreateSlot(role);
  const showVisa = canVisa(role);

  return (
    <>
      <MarkNavSeen channel="elenco" />
      <div className="row-between" style={{ alignItems: "center" }}>
        <h1>Elenco slot</h1>
        {showCreate && (
          <Link href="/admin/nuovo" className="btn-primary">
            Nuovo slot
          </Link>
        )}
      </div>
      <p className="page-lead">
        La vicepreside apre lo slot e assegna (o accetta una proposta). Il
        dirigente dà il visto; solo dopo il docente può Accettare. I recuperi
        non impegnano il budget.
      </p>

      {groups.length === 0 && (
        <p className="empty-state">Nessuno slot ancora. Crea un nuovo slot.</p>
      )}

      {groups.map((g) => (
        <section key={g.key} className="month-group">
          <h2 className="month-title">{g.label}</h2>
          <table className="slot-table">
            <colgroup>
              {/* Larghezze fisse: non saltano tra libero ↔ assegnato.
                  DATA ≥ giorno+gg/mm/aaaa senza clip (~11%). */}
              <col className="col-data" style={{ width: "11%" }} />
              <col className="col-ora" style={{ width: "8%" }} />
              <col className="col-classe" style={{ width: "7%" }} />
              <col className="col-plesso" style={{ width: "7%" }} />
              <col className="col-euro" style={{ width: "9%" }} />
              <col className="col-visto" style={{ width: "11%" }} />
              <col className="col-stato" style={{ width: "13%" }} />
              <col className="col-docente" style={{ width: "9%" }} />
              <col className="col-azioni" style={{ width: "25%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Data</th>
                <th>Ora</th>
                <th>Classe</th>
                <th>Plesso</th>
                <th>€</th>
                <th>Visto</th>
                <th>Stato</th>
                <th>Docente</th>
                <th className="th-azioni">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {g.slots.map((s) => {
                const candidati = showAssign
                  ? listCandidatiForSlot({
                      sede_id: s.sede_id,
                      fascia: s.fascia,
                      date: s.date,
                      ora: s.ora,
                    })
                  : [];
                const proposte = showAssign ? listProposteForSlot(s.id) : [];
                const euro = effectiveImporto(s.importo_eur, s.is_recupero);
                return (
                  <tr key={s.id}>
                    <td className="td-fit">
                      <DateIt date={s.date} />
                    </td>
                    <td className="td-fit">
                      {labelOra(s.ora)}
                      <span className="note-sub">
                        {formatTimeRange(s.start_time, s.end_time)}
                      </span>
                    </td>
                    <td className="td-fit">
                      {s.classe_name || "—"}
                      {s.note ? (
                        <span className="note-sub">{s.note}</span>
                      ) : null}
                    </td>
                    <td className="td-fit">{s.sede_name || "—"}</td>
                    <td className="td-fit">
                      {s.is_recupero
                        ? "Recupero · 0 €"
                        : formatEuro(euro || s.importo_eur)}
                    </td>
                    <td className="td-fit">
                      <div className="visto-cell">
                        <VisaBadge status={s.visa_status} />
                        {showVisa && s.visa_status === "awaiting" && (
                          <VisaActions slotId={s.id} />
                        )}
                      </div>
                    </td>
                    <td className="td-fit">
                      <AssignmentBadge
                        status={s.assignment_status}
                        isUfficio={s.is_ufficio}
                        isRecupero={s.is_recupero}
                        visaStatus={s.visa_status}
                      />
                      {s.refuse_motivo && (
                        <span className="note-sub">
                          Motivo: {s.refuse_motivo}
                        </span>
                      )}
                    </td>
                    <td className="td-fit">{s.docente_name || "—"}</td>
                    <td className="td-azioni">
                      <SlotActions
                        slot={s}
                        candidati={candidati}
                        proposte={proposte}
                        canAssign={showAssign}
                        canDelete={showCreate}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}
