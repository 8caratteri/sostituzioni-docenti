import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isStaff } from "@/lib/slots";

export default async function DocenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  getDb();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (isStaff(session.user.role)) redirect("/admin");

  return (
    <>
      <div className="app-chrome">
        <header className="docente-nav">
          <div className="brand-block">
            <Link href="/docente" className="brand-name">
              Sostituzioni
            </Link>
            <span className="brand-sub">CPIA · docente</span>
          </div>
          <nav className="docente-nav-links">
            <Link href="/docente">Le mie ore</Link>
            <Link href="/docente/aperti">Slot aperti</Link>
          </nav>
          <div className="docente-nav-right">
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
            <span className="user-pill">{session.user.name}</span>
          </div>
        </header>
      </div>
      <main>{children}</main>
    </>
  );
}
