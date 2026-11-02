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
      <form action={actionAddSede} className="card plesso-add-card form-grid">
        <h2>Nuovo plesso</h2>
        <label>
          Nome
          <input name="name" required placeholder="es. Aulla" />
        </label>
        <button type="submit" className="btn-primary">
          Aggiungi plesso
        </button>
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
                {cs.map((c) => (
                  <li key={c.id}>
                    {c.name}{" "}
                    <span className="muted tiny">({c.fascia})</span>
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
                <select name="fascia" defaultValue="mattina">
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
