"use client";

import { useTransition } from "react";
import { actionDemoLogin } from "@/app/actions";
import { roleLabel } from "@/lib/permissions";
import type { SessionUser } from "@/lib/types";

export function DemoLoginForm({
  staff,
  docenti,
}: {
  staff: SessionUser[];
  docenti: SessionUser[];
}) {
  const [pending, start] = useTransition();

  const submit = (userId: string) => {
    const fd = new FormData();
    fd.set("userId", userId);
    start(async () => {
      await actionDemoLogin(fd);
    });
  };

  return (
    <>
      <p className="small" style={{ marginTop: "1.15rem", fontWeight: 650 }}>
        Modalità prova — personale:
      </p>
      <div className="demo-list">
        {staff.map((u) => (
          <button
            key={u.id}
            type="button"
            disabled={pending}
            onClick={() => submit(u.id)}
          >
            {u.name}
            <span className="role">{roleLabel(u.role)}</span>
          </button>
        ))}
      </div>

      <p className="small" style={{ marginTop: "1rem", fontWeight: 650 }}>
        Docenti:
      </p>
      <div className="demo-docente-row">
        <select
          defaultValue=""
          disabled={pending}
          onChange={(e) => {
            const v = e.target.value;
            if (v) submit(v);
          }}
        >
          <option value="" disabled>
            Scegli un docente…
          </option>
          {docenti.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
