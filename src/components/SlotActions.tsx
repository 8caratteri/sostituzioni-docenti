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
  const emptyAvailable = available.length === 0;

  function assign(docente: string, allowOutside: boolean, clear: () => void) {
    if (!docente) return;
    const fd = new FormData();
    fd.set("slot_id", String(slot.id));
    fd.set("docente_id", docente);
    if (allowOutside) fd.set("allow_outside", "1");
    start(async () => {
      try {
        await actionAssign(fd);
        clear();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Errore");
      }
    });
  }

  const deleteBtn = canDelete ? (
    <ConfirmDelete
      action={actionDeleteSlot}
      hiddenFields={{ slot_id: slot.id }}
      tooltip="Elimina slot"
      title="Eliminare questo slot?"
    />
  ) : null;

  if (slot.visa_status === "rejected") {
    return (
      <div className="actions-row">
        <span className="locked-note">Visto rifiutato</span>
        {deleteBtn ? <div className="delete-cell">{deleteBtn}</div> : null}
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
          <div className="actions-inline-end">
            <span className="locked-note">Bloccato (accettato)</span>
            {deleteBtn}
          </div>
        ) : hasActive ? (
          <div className="assigned-actions">
            <div className="actions-inline-end">
              <span className="small">
                {slot.docente_name}
                {slot.is_recupero ? " · recupero" : ""}
              </span>
              {deleteBtn}
            </div>
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
          <div
            className={
              emptyAvailable ? "assign-panel assign-panel-empty" : "assign-stack"
            }
          >
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

            {emptyAvailable ? (
              <>
                <div className="assign-alert-row">
                  <p className="candidati-empty">
                    Nessun docente disponibile per questo plesso, fascia e
                    orario.
                  </p>
                  {deleteBtn}
                </div>

                <label className="assign-select-label">
                  Docente
                  <select
                    value={outsideId}
                    onChange={(e) => setOutsideId(e.target.value)}
                    aria-label="Scegli docente"
                  >
                    <option value="">Scegli docente…</option>
                    {candidati.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.priority ? "★ " : ""}
                        {c.name}
                        {c.priority ? ` · recupero ${c.ore_recupero}h` : ""}
                        {!c.available ? " · fuori disp." : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="assign-btns-row">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={pending || !outsideId}
                    onClick={() =>
                      assign(outsideId, false, () => setOutsideId(""))
                    }
                  >
                    Assegna
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={pending || !outsideId}
                    onClick={() =>
                      assign(outsideId, true, () => setOutsideId(""))
                    }
                  >
                    Assegna comunque
                  </button>
                </div>
              </>
            ) : (
              <>
                <form
                  className="assign-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    assign(docenteId, false, () => setDocenteId(""));
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
                    assign(outsideId, true, () => setOutsideId(""));
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

                {deleteBtn ? (
                  <div className="delete-cell delete-cell-inline">{deleteBtn}</div>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <div className="actions-inline-end">
            <span className="muted small">—</span>
            {deleteBtn}
          </div>
        )}

        {slot.assignment_status === "pending" &&
          slot.visa_status === "approved" &&
          slot.confirm_deadline && (
            <div className="muted tiny">
              Scade {new Date(slot.confirm_deadline).toLocaleString("it-IT")}
            </div>
          )}
      </div>
    </div>
  );
}
