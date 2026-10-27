import Link from "next/link";
import { signOut } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

export function StaffNav({
  user,
  awaitingCount = 0,
}: {
  user: SessionUser;
  awaitingCount?: number;
}) {
  return (
    <header className="staff-nav">
      <nav className="staff-nav-links">
        <Link href="/admin">Elenco slot</Link>
        <Link href="/admin/budget">Budget e tariffe</Link>
        <Link href="/admin/classi">Classi e sedi</Link>
        <Link href="/admin/disponibilita">Disponibilità</Link>
        <Link href="/admin/nuovo">Nuovo slot</Link>
        {user.role === "dirigente" && (
          <Link href="/admin/visto">
            Da vistare
            {awaitingCount > 0 ? ` (${awaitingCount})` : ""}
          </Link>
        )}
        <Link href="/api/export/excel">Esporta Excel</Link>
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
  );
}
