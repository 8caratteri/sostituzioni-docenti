import Link from "next/link";
import { redirect } from "next/navigation";
import {
  actionAddClasse,
  actionAddSede,
  actionDeleteClasse,
  actionDeleteSede,
} from "@/app/actions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { auth } from "@/lib/auth";
import { listClassi, listSedi } from "@/lib/catalog";
import { canManageCatalog } from "@/lib/permissions";

export default async function ClassiPage() {
  const session = await auth();
  if (!session?.user || !canManageCatalog(session.user.role)) {
    redirect("/admin");
  }
  const sedi = listSedi();
  const classi = listClassi();

  return (
    <>
      <p>
        <Link href="/admin">Torna all&apos;elenco</Link>
      </p>
      <h1>Plessi e classi</h1>
      <p className="page-lead">
        Le classi stanno sotto ciascun plesso. Aulla è un solo plesso: Mattina e
        Pomeriggio sono classi, non plessi separati.
      </p>

      <form action={actionAddSede} className="mgmt-toolbar card">
        <div className="mgmt-toolbar-title">Nuovo plesso</div>
        <div className="mgmt-toolbar-row">
          <label className="mgmt-grow">
            Nome
            <input name="name" required placeholder="es. Aulla" />
          </label>
          <div className="mgmt-toolbar-action">
            <button type="submit" className="btn-primary">
              Aggiungi plesso
            </button>
          </div>
        </div>
      </form>

      <div className="plessi-grid">
        {sedi.map((s) => {
          const cs = classi.filter((c) => c.sede_id === s.id);
          return (
            <div key={s.id} className="card plesso-card">
              <div className="plesso-card-head">
                <strong>{s.name}</strong>
                <ConfirmDelete
                  action={actionDeleteSede}
                  hiddenFields={{ id: s.id }}
                  tooltip="Elimina plesso"
                  title="Eliminare questo plesso?"
                />
              </div>
              <ul className="classe-list">
                {cs.length === 0 && (
                  <li className="classe-empty muted small">Nessuna classe</li>
                )}
                {cs.map((c) => (
                  <li key={c.id}>
                    <span>
                      {c.name}{" "}
                      <span className="muted tiny">({c.fascia})</span>
                    </span>
                    <ConfirmDelete
                      action={actionDeleteClasse}
                      hiddenFields={{ id: c.id }}
                      tooltip="Elimina classe"
                      title="Eliminare questa classe?"
                    />
                  </li>
                ))}
              </ul>
              <form action={actionAddClasse} className="plesso-card-form">
                <input type="hidden" name="sede_id" value={s.id} />
                <input name="name" placeholder="Classe" required />
                <select name="fascia" defaultValue="mattina" aria-label="Fascia">
                  <option value="mattina">Mattina</option>
                  <option value="pomeriggio">Pomeriggio</option>
                </select>
                <button type="submit" className="btn-primary">
                  Aggiungi
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </>
  );
}
