"use client";

import { useState, useTransition } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
  hiddenFields?: Record<string, string | number>;
  label?: string;
  title?: string;
  confirmLabel?: string;
};

export function ConfirmDelete({
  action,
  hiddenFields = {},
  label = "×",
  title = "Eliminare?",
  confirmLabel = "Elimina",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        type="button"
        className="btn-x"
        title="Elimina"
        aria-label="Elimina"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <p className="modal-title">{title}</p>
            <p className="muted small">
              L&apos;operazione non si può annullare.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Annulla
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={pending}
                onClick={() => {
                  const fd = new FormData();
                  for (const [k, v] of Object.entries(hiddenFields)) {
                    fd.set(k, String(v));
                  }
                  start(async () => {
                    await action(fd);
                    setOpen(false);
                  });
                }}
              >
                {pending ? "…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
