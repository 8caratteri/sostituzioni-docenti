"use client";

import { useState, useTransition } from "react";
import { actionVisa } from "@/app/actions";

export function VisaActions({ slotId }: { slotId: number }) {
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  function submit(decision: "approved" | "rejected") {
    if (decision === "rejected" && note.trim().length < 3) {
      alert("Motivo rifiuto (obbligatorio)");
      return;
    }
    const fd = new FormData();
    fd.set("slot_id", String(slotId));
    fd.set("decision", decision);
    if (note.trim()) fd.set("note", note.trim());
    start(async () => {
      try {
        await actionVisa(fd);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Errore");
      }
    });
  }

  return (
    <div className="visa-inline visa-inline-simple">
      <label className="small">
        Motivo rifiuto (obbligatorio)
        <input
          type="text"
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={pending}
          placeholder="Solo se rifiuti"
        />
      </label>
      <div className="visa-inline-btns">
        <button
          type="button"
          className="btn-primary"
          disabled={pending}
          onClick={() => submit("approved")}
        >
          Approva
        </button>
        <button
          type="button"
          className="btn-danger"
          disabled={pending}
          onClick={() => submit("rejected")}
        >
          Rifiuta
        </button>
      </div>
    </div>
  );
}
