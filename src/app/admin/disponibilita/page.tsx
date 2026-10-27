import Link from "next/link";
import {
  actionRemoveDisponibilita,
  actionSetDisponibilita,
} from "@/app/actions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { listAllTeachersWithDisponibilita } from "@/lib/slots";

export default async function DisponibilitaPage() {
  const teachers = listAllTeachersWithDisponibilita();

  return (
    <>
      <div className="row-between">
        <h1>Disponibilità docenti</h1>
        <Link href="/admin">Torna all&apos;elenco</Link>
      </div>
      <p className="muted small">
        Solo i docenti in questo elenco compaiono nel menu Assegna. Chi non ha
        una disponibilità non può essere assegnato.
      </p>

      <div className="list-stack">
        {teachers.map((t) => (
          <div key={t.id} className="card row-between">
            <div>
              <strong>{t.name}</strong>
              <div className="muted small">{t.email}</div>
              {t.disponibilita ? (
                <div style={{ marginTop: "0.35rem" }}>{t.disponibilita}</div>
              ) : (
                <div className="muted small" style={{ marginTop: "0.35rem" }}>
                  Non in elenco disponibilità
                </div>
              )}
            </div>
            <div style={{ display: "grid", gap: "0.4rem", justifyItems: "end" }}>
              <form action={actionSetDisponibilita} className="inline-form">
                <input type="hidden" name="user_id" value={t.id} />
                <input
                  type="text"
                  name="label"
                  placeholder="Es. Mattina · sedi centrali"
                  defaultValue={t.disponibilita || ""}
                  required
                />
                <button type="submit" className="btn-primary">
                  {t.disponibilita ? "Aggiorna" : "Aggiungi"}
                </button>
              </form>
              {t.disponibilita && (
                <ConfirmDelete
                  action={actionRemoveDisponibilita}
                  hiddenFields={{ user_id: t.id }}
                  title={`Togliere ${t.name} dalla disponibilità?`}
                  confirmLabel="Rimuovi"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
