"use client";

import { useMemo, useState, useTransition } from "react";
import {
  actionAcceptProposta,
  actionAssign,
  actionDeleteSlot,
  actionRemove,
} from "@/app/actions";
import { ConfirmDelete } from "./ConfirmDelete";
import type { Candidato, SlotListItem } from "@/lib/types";

type Proposta = {
  id: number;
  docente_id: string;
  docente_name: string;
};

function optionLabel(c: Candidato) {
  return `${c.priority ? "★ " : ""}${c.name}${
    c.priority ? ` · recupero ${c.ore_recupero}h` : ""
  }`;
}

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

  const lockedConfirmed =
    slot.assignment_status === "confirmed" && !slot.is_ufficio;
  const hasActive =
    slot.assignment_status === "pending" ||
    (slot.assignment_status === "confirmed" && !!slot.is_ufficio);

  const available = useMemo(
    () => candidati.filter((c) => c.available),
    [candidati]
  );
  const unavailable = useMemo(
    () => candidati.filter((c) => !c.available),
    [candidati]
  );
  const noneAvailable = available.length === 0;

  const selected = candidati.find((c) => c.id === docenteId);
  const selectedUnavailable = !!selected && !selected.available;
  /** Solo «Assegna comunque» se nessuno in disp. oppure se ha scelto fuori disp. */
  const useComunque = noneAvailable || selectedUnavailable;

  function assign() {
    if (!docenteId) return;
    const fd = new FormData();
    fd.set("slot_id", String(slot.id));
    fd.set("docente_id", docenteId);
    if (useComunque) fd.set("allow_outside", "1");
    start(async () => {
      try {
        await actionAssign(fd);
        setDocenteId("");
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
      <div className="actions-row actions-inline-end">
        <span className="locked-note">Visto rifiutato</span>
        {deleteBtn}
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
          <div className="assign-panel">
            <div className="assign-panel-head">
              <div className="assign-panel-head-main">
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
                              alert(
                                err instanceof Error ? err.message : "Errore"
                              );
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
                {noneAvailable ? (
                  <p className="candidati-empty">
                    Nessun docente disponibile per questo plesso, fascia e
                    orario.
                  </p>
                ) : null}
              </div>
              {deleteBtn}
            </div>

            <label className="assign-select-label">
              Docente
              <select
                value={docenteId}
                onChange={(e) => setDocenteId(e.target.value)}
                aria-label="Scegli docente"
              >
                <option value="">Scegli docente…</option>
                {noneAvailable ? (
                  candidati.map((c) => (
                    <option key={c.id} value={c.id}>
                      {optionLabel(c)}
                    </option>
                  ))
                ) : (
                  <>
                    <optgroup label="Disponibili">
                      {available.map((c) => (
                        <option key={c.id} value={c.id}>
                          {optionLabel(c)}
                        </option>
                      ))}
                    </optgroup>
                    {unavailable.length > 0 && (
                      <optgroup label="Non disponibili in questa ora">
                        {unavailable.map((c) => (
                          <option key={c.id} value={c.id}>
                            {optionLabel(c)}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </>
                )}
              </select>
            </label>

            {selectedUnavailable && !noneAvailable ? (
              <p className="assign-outside-note">
                Docente non disponibile in questa ora — assegna comunque?
              </p>
            ) : null}

            <div className="assign-btns-row">
              <button
                type="button"
                className={useComunque ? "btn-secondary" : "btn-primary"}
                disabled={pending || !docenteId}
                onClick={assign}
              >
                {useComunque ? "Assegna comunque" : "Assegna"}
              </button>
            </div>
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
