import Link from "next/link";
import { redirect } from "next/navigation";
import {
  actionAddDocente,
  actionDeleteDocente,
  actionSetRecupero,
} from "@/app/actions";
import { auth } from "@/lib/auth";
import { listDocenti } from "@/lib/catalog";
import { getOreRecupero } from "@/lib/pagamento";
import { canManageTeachers } from "@/lib/permissions";
import { ConfirmDelete } from "@/components/ConfirmDelete";

export default async function DocentiPage() {
  const session = await auth();
  if (!session?.user || !canManageTeachers(session.user.role)) {
    redirect("/admin");
  }
  const docenti = listDocenti().map((d) => ({
    ...d,
    ore_recupero: getOreRecupero(d.id),
  }));

  return (
    <>
      <p>
        <Link href="/admin">Torna all&apos;elenco</Link>
      </p>
      <h1>Docenti</h1>
      <p className="page-lead">
        Aggiungi docenti e aggiorna le ore di recupero. Apri la scheda per
        vedere le ore assegnate.
      </p>

      <form action={actionAddDocente} className="mgmt-toolbar card">
        <div className="mgmt-toolbar-title">Nuovo docente</div>
        <div className="mgmt-toolbar-row">
          <label>
            Nome
            <input name="name" type="text" required placeholder="Cognome Nome" />
          </label>
          <label>
            Email
            <input name="email" type="email" placeholder="opzionale" />
          </label>
          <div className="mgmt-toolbar-action">
            <button type="submit" className="btn-primary">
              Aggiungi
            </button>
          </div>
        </div>
      </form>

      <div className="docenti-grid">
        {docenti.map((d) => (
          <div key={d.id} className="card docente-card">
            <div className="docente-card-head">
              <div className="docente-card-identity">
                <Link
                  href={`/admin/docenti/${d.id}`}
                  className="docente-scheda-link"
                >
                  <strong>{d.name}</strong>
                </Link>
                <div className="muted small">{d.email}</div>
              </div>
              <ConfirmDelete
                action={actionDeleteDocente}
                hiddenFields={{ id: d.id }}
                tooltip="Disattiva docente"
                title="Disattivare questo docente?"
                confirmLabel="Disattiva"
              />
            </div>
            <form action={actionSetRecupero} className="inline-recupero">
              <input type="hidden" name="user_id" value={d.id} />
              <label>
                Ore recupero
                <input
                  type="number"
                  name="ore_recupero"
                  defaultValue={d.ore_recupero}
                  min={0}
                  step={0.5}
                />
              </label>
              <button type="submit" className="btn-secondary">
                Salva
              </button>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
