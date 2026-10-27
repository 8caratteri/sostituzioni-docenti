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
      <header className="docente-nav">
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link href="/docente">Le mie ore</Link>
          <Link href="/docente/aperti">Slot aperti</Link>
        </nav>
        <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
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
      <main>{children}</main>
    </>
  );
}
