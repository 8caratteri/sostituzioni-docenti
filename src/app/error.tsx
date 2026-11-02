"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: "2rem 1.25rem", maxWidth: 520 }}>
      <h1 style={{ fontSize: "1.35rem", marginBottom: "0.5rem" }}>
        Qualcosa è andato storto
      </h1>
      <p className="muted" style={{ marginBottom: "1rem" }}>
        Spesso basta ricaricare la pagina (soprattutto dopo un aggiornamento
        dell&apos;anteprima). Se ripeti l&apos;azione e l&apos;errore resta,
        segnalalo.
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
          onClick={() => window.location.assign("/admin")}
        >
          Torna all&apos;elenco
        </button>
      </div>
    </main>
  );
}
