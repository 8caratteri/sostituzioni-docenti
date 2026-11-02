"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: "1.25rem 0" }}>
      <h1 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>
        Errore nell&apos;elenco
      </h1>
      <p className="page-lead">
        Se hai la pagina aperta da prima di un aggiornamento, ricarica (F5) e
        ripeti Assegna. Non è perso il lavoro già salvato.
      </p>
      {error?.digest ? (
        <p className="tiny muted">Codice: {error.digest}</p>
      ) : null}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" className="btn-primary" onClick={() => reset()}>
          Riprova
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => window.location.reload()}
        >
          Ricarica pagina
        </button>
      </div>
    </div>
  );
}
