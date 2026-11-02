"use client";

import { useState, useTransition } from "react";

export function ConfirmDelete({
  action,
  hiddenFields = {},
  label = "×",
  tooltip,
  title = "Eliminare?",
  confirmLabel = "Elimina",
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenFields?: Record<string, string | number>;
  label?: string;
  tooltip?: string;
  title?: string;
  confirmLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const aria = tooltip || title || "Elimina";

  return (
    <>
      <button
        type="button"
        className="btn-x"
        title={aria}
        aria-label={aria}
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
