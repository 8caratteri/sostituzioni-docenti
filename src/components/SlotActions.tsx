"use client";

import { useMemo, useState, useTransition } from "react";
import {
  actionAcceptProposta,
  actionAssign,
  actionDeleteSlot,
  actionRemove,
} from "@/app/actions";
import { CandidatiSuggeriti } from "./CandidatiSuggeriti";
import { ConfirmDelete } from "./ConfirmDelete";
import type { Candidato, SlotListItem } from "@/lib/types";

type Proposta = {
  id: number;
  docente_id: string;
  docente_name: string;
};

export function SlotActions({
  slot,
  candidati,
  proposte = [],
  canAssign,
  canDelete,
}: {
  slot: SlotListItem;
  candidati: Candidato[];
  proposte?: Proposta[];
  canAssign: boolean;
  canDelete: boolean;
}) {
  const [pending, start] = useTransition();
  const [docenteId, setDocenteId] = useState("");
  const [outsideId, setOutsideId] = useState("");

  const lockedConfirmed =
    slot.assignment_status === "confirmed" && !slot.is_ufficio;
  const hasActive =
    slot.assignment_status === "pending" ||
    (slot.assignment_status === "confirmed" && !!slot.is_ufficio);

  const available = useMemo(
    () => candidati.filter((c) => c.available),
    [candidati]
  );

  if (slot.visa_status === "rejected") {
    return (
      <div className="actions-row">
        <span className="locked-note">Visto rifiutato</span>
        {canDelete && (
          <div className="delete-cell">
            <ConfirmDelete
              action={actionDeleteSlot}
              hiddenFields={{ slot_id: slot.id }}
              tooltip="Elimina slot"
              title="Eliminare questo slot?"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="actions-row actions-elenco">
      <div className="assign-cell">
        {(slot.last_refuse_motivo || slot.refuse_motivo) && (
          <div className="refuse-motivo">
            Motivo rifiuto
            {slot.last_refuse_docente_name
              ? ` (${slot.last_refuse_docente_name})`
              : ""}
            : {slot.last_refuse_motivo || slot.refuse_motivo}
          </div>
        )}

        {lockedConfirmed ? (
          <span className="locked-note">Bloccato (accettato)</span>
        ) : hasActive ? (
          <div className="assigned-actions">
            <span className="small">
              {slot.docente_name}
              {slot.is_recupero ? " · recupero" : ""}
            </span>
            {canAssign && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  start(async () => {
                    try {
                      await actionRemove(fd);
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Errore");
                    }
                  });
                }}
              >
                <input type="hidden" name="slot_id" value={slot.id} />
                <button
                  type="submit"
                  className="btn-secondary"
                  disabled={pending}
                >
                  Rimuovi assegnazione
                </button>
              </form>
            )}
          </div>
        ) : canAssign ? (
          <div className="assign-stack">
            {proposte.length > 0 && (
              <div className="proposte-block">
                {proposte.map((p) => (
                  <form
                    key={p.id}
                    className="proposta-row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      start(async () => {
                        try {
                          await actionAcceptProposta(fd);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Errore");
                        }
                      });
                    }}
                  >
                    <input type="hidden" name="proposta_id" value={p.id} />
                    <span className="small">
                      Proposta: <strong>{p.docente_name}</strong>
                    </span>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={pending}
                    >
                      Accetta proposta
                    </button>
                  </form>
                ))}
              </div>
            )}

            <form
              className="assign-form"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                start(async () => {
                  try {
                    await actionAssign(fd);
                    setDocenteId("");
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Errore");
                  }
                });
              }}
            >
              <input type="hidden" name="slot_id" value={slot.id} />
              <CandidatiSuggeriti
                candidati={available}
                value={docenteId}
                onChange={setDocenteId}
                narrow
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={pending || !docenteId}
              >
                Assegna
              </button>
            </form>

            <form
              className="assign-form assegna-comunque"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("allow_outside", "1");
                start(async () => {
                  try {
                    await actionAssign(fd);
                    setOutsideId("");
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Errore");
                  }
                });
              }}
            >
              <input type="hidden" name="slot_id" value={slot.id} />
              <CandidatiSuggeriti
                candidati={candidati}
                value={outsideId}
                onChange={setOutsideId}
                narrow
              />
              <button
                type="submit"
                className="btn-secondary"
                disabled={pending || !outsideId}
              >
                Assegna comunque
              </button>
            </form>
          </div>
        ) : (
          <span className="muted small">—</span>
        )}

        {slot.assignment_status === "pending" &&
          slot.visa_status === "approved" &&
          slot.confirm_deadline && (
            <div className="muted tiny">
              Scade {new Date(slot.confirm_deadline).toLocaleString("it-IT")}
            </div>
          )}
      </div>

      {canDelete && (
        <div className="delete-cell">
          <ConfirmDelete
            action={actionDeleteSlot}
            hiddenFields={{ slot_id: slot.id }}
            tooltip="Elimina slot"
            title="Eliminare questo slot?"
          />
        </div>
      )}
    </div>
  );
}
