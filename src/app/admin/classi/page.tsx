import Link from "next/link";
import {
  actionAddClasse,
  actionAddSede,
  actionDeleteClasse,
  actionDeleteSede,
} from "@/app/actions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { listClassi, listSedi } from "@/lib/catalog";

export default async function ClassiSediPage() {
  const classi = listClassi();
  const sedi = listSedi();

  return (
    <>
      <div className="row-between">
        <h1>Classi e sedi</h1>
        <Link href="/admin">Torna all&apos;elenco</Link>
      </div>
      <p className="muted small">
        Questi elenchi alimentano i menu a discesa quando crei uno slot.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Classi</h2>
          <form action={actionAddClasse} className="inline-form" style={{ marginBottom: "0.75rem" }}>
            <input type="text" name="name" placeholder="Nuova classe" required />
            <button type="submit" className="btn-primary">
              Aggiungi
            </button>
          </form>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {classi.map((c) => (
              <li
                key={c.id}
                className="row-between"
                style={{
                  padding: "0.4rem 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span>{c.name}</span>
                <ConfirmDelete
                  action={actionDeleteClasse}
                  hiddenFields={{ id: c.id }}
                  title={`Eliminare la classe «${c.name}»?`}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Sedi</h2>
          <form action={actionAddSede} className="inline-form" style={{ marginBottom: "0.75rem" }}>
            <input type="text" name="name" placeholder="Nuova sede" required />
            <button type="submit" className="btn-primary">
              Aggiungi
            </button>
          </form>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sedi.map((s) => (
              <li
                key={s.id}
                className="row-between"
                style={{
                  padding: "0.4rem 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span>{s.name}</span>
                <ConfirmDelete
                  action={actionDeleteSede}
                  hiddenFields={{ id: s.id }}
                  title={`Eliminare la sede «${s.name}»?`}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
