import Link from "next/link";
import { signOut } from "@/lib/auth";
import {
  canCreateSlot,
  canManageBudget,
  canManageClassi,
  canManageDisponibilita,
  canManageTeachers,
  canExport,
  roleLabel,
} from "@/lib/permissions";
import type { SessionUser } from "@/lib/types";

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return <span className="nav-badge">{n > 99 ? "99+" : n}</span>;
}

export function StaffNav({
  user,
  badgeCount = 0,
}: {
  user: SessionUser;
  badgeCount?: number;
}) {
  const elencoBadge =
    user.role === "vicepreside" || user.role === "dirigente"
      ? badgeCount
      : 0;

  return (
    <div className="app-chrome">
      <header className="staff-nav">
        <div className="brand-block">
          <Link href="/admin" className="brand-name">
            Sostituzioni
          </Link>
          <span className="brand-sub">CPIA · {roleLabel(user.role)}</span>
        </div>
        <nav className="staff-nav-links">
          <Link href="/admin">
            Elenco
            <Badge n={elencoBadge} />
          </Link>
          {canManageBudget(user.role) && (
            <Link href="/admin/budget">Budget</Link>
          )}
          {canManageClassi(user.role) && (
            <Link href="/admin/classi">Plessi/classi</Link>
          )}
          {canManageDisponibilita(user.role) && (
            <Link href="/admin/disponibilita">Disponibilità</Link>
          )}
          {canManageTeachers(user.role) && (
            <Link href="/admin/docenti">Docenti</Link>
          )}
          {canCreateSlot(user.role) && (
            <Link href="/admin/nuovo">Nuovo slot</Link>
          )}
          {canExport(user.role) && (
            <Link href="/api/export/excel">Esporta</Link>
          )}
        </nav>
        <div className="staff-nav-right">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="linkish">
              Esci
            </button>
          </form>
          <span className="user-pill">{user.name}</span>
        </div>
      </header>
    </div>
  );
}
