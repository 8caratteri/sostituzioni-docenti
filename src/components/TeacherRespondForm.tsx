"use client";

import { useState, useTransition } from "react";
import { actionTeacherRespond } from "@/app/actions";

export function TeacherRespondForm({
  assignmentId,
  canAccept = true,
  waitingVisa = false,
}: {
  assignmentId: number;
  canAccept?: boolean;
  waitingVisa?: boolean;
}) {
  const [motivo, setMotivo] = useState("");
  const [pending, start] = useTransition();

  if (waitingVisa || !canAccept) {
    return (
      <p className="muted small" style={{ marginTop: "0.45rem" }}>
        {waitingVisa
          ? "Potrai Accettare o Rifiutare dopo il visto del dirigente."
          : "Nessuna azione richiesta."}
      </p>
    );
  }

  function submit(decision: "accept" | "refuse") {
    if (decision === "refuse" && motivo.trim().length < 3) {
      alert("Indica il motivo del rifiuto (obbligatorio)");
      return;
    }
    const fd = new FormData();
    fd.set("assignment_id", String(assignmentId));
    fd.set("decision", decision);
    if (decision === "refuse") fd.set("refuse_motivo", motivo.trim());
    start(async () => {
      try {
        await actionTeacherRespond(fd);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Errore");
      }
    });
  }

  return (
    <div className="teacher-respond" style={{ marginTop: "0.55rem" }}>
      <label className="teacher-respond-motivo">
        Motivo del rifiuto (obbligatorio)
        <textarea
          name="refuse_motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          disabled={pending}
          rows={2}
        />
      </label>
      <div className="teacher-respond-actions">
        <button
          type="button"
          className="btn-primary"
          disabled={pending}
          onClick={() => submit("accept")}
        >
          Accetta
        </button>
        <button
          type="button"
          className="btn-danger"
          disabled={pending}
          onClick={() => submit("refuse")}
        >
          Rifiuta
        </button>
      </div>
    </div>
  );
}
