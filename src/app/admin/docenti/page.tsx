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
      <form action={actionAddDocente} className="form-grid card">
        <h2>Nuovo docente</h2>
        <label>
          Nome
          <input name="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" />
        </label>
        <button type="submit" className="btn-primary">
          Aggiungi
        </button>
      </form>

      <div className="docenti-grid">
        {docenti.map((d) => (
          <div key={d.id} className="card docente-card">
            <Link href={`/admin/docenti/${d.id}`} className="docente-scheda-link">
              <strong>{d.name}</strong>
            </Link>
            <div className="muted small">{d.email}</div>
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
            <ConfirmDelete
              action={actionDeleteDocente}
              hiddenFields={{ id: d.id }}
              tooltip="Disattiva docente"
              title="Disattivare questo docente?"
              confirmLabel="Disattiva"
            />
          </div>
        ))}
      </div>
    </>
  );
}
