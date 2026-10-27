"use client";

import { useTransition } from "react";
import { actionAssign, actionDeleteSlot, actionRemove } from "@/app/actions";
import { ConfirmDelete } from "./ConfirmDelete";
import type { SlotListItem } from "@/lib/types";

type Teacher = {
  id: string;
  name: string;
  disponibilita: string;
};

export function SlotActions({
  slot,
  teachers,
}: {
  slot: SlotListItem;
  teachers: Teacher[];
}) {
  const [pending, start] = useTransition();
  const lockedConfirmed =
    slot.assignment_status === "confirmed" && !slot.is_ufficio;
  const hasActive =
    slot.assignment_status === "pending" ||
    (slot.assignment_status === "confirmed" && !!slot.is_ufficio);
  const canAssignUi =
    slot.visa_status === "approved" && !lockedConfirmed;

  return (
    <div className="actions-row">
      <div className="assign-cell">
        {lockedConfirmed ? (
          <span className="muted small">Bloccato (accettato)</span>
        ) : slot.visa_status !== "approved" ? (
          <span className="muted small">In attesa di visto</span>
        ) : hasActive ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                await actionRemove(fd);
              });
            }}
          >
            <input type="hidden" name="slot_id" value={slot.id} />
            <button type="submit" className="btn-secondary" disabled={pending}>
              Rimuovi
            </button>
          </form>
        ) : canAssignUi ? (
          <form
            className="assign-form"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                try {
                  await actionAssign(fd);
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Errore");
                }
              });
            }}
          >
            <input type="hidden" name="slot_id" value={slot.id} />
            <select name="docente_id" required defaultValue="" disabled={pending}>
              <option value="" disabled>
                Docente…
              </option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.disponibilita}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary" disabled={pending}>
              Assegna
            </button>
          </form>
        ) : (
          <span className="muted small">—</span>
        )}
        {slot.assignment_status === "pending" && slot.confirm_deadline && (
          <div className="muted tiny">
            Scade{" "}
            {new Date(slot.confirm_deadline).toLocaleString("it-IT")}
          </div>
        )}
      </div>
      <div className="delete-cell">
        <ConfirmDelete
          action={actionDeleteSlot}
          hiddenFields={{ slot_id: slot.id }}
          title="Eliminare questo slot?"
        />
      </div>
    </div>
  );
}
