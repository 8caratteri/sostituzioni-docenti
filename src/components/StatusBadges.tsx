import type { AssignmentStatus, VisaStatus } from "@/lib/types";

export function VisaBadge({ status }: { status: VisaStatus }) {
  if (status === "approved") {
    return <span className="badge badge-visa">Vistato</span>;
  }
  if (status === "awaiting") {
    return <span className="badge badge-warn">In attesa di visto</span>;
  }
  return <span className="badge badge-danger">Visto rifiutato</span>;
}

export function AssignmentBadge({
  status,
  isUfficio,
}: {
  status: AssignmentStatus | null;
  isUfficio?: number | null;
}) {
  if (!status) {
    return <span className="badge badge-free">Libero</span>;
  }
  if (status === "pending") {
    return <span className="badge badge-warn">In attesa docente</span>;
  }
  if (status === "confirmed") {
    return (
      <span className="badge badge-ok">
        {isUfficio ? "Confermato (d’ufficio)" : "Confermato"}
      </span>
    );
  }
  if (status === "expired") {
    return <span className="badge badge-muted">Scaduto</span>;
  }
  if (status === "refused") {
    return <span className="badge badge-danger">Rifiutato</span>;
  }
  return <span className="badge badge-muted">Annullato</span>;
}
