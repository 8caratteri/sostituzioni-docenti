import { redirect } from "next/navigation";
import { auth, getDemoStaff } from "@/lib/auth";
import { listDocenti } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { DemoLoginForm } from "@/components/DemoLoginForm";

export default async function LoginPage() {
  getDb();
  const session = await auth();
  if (session?.user) redirect("/");

  const demo = process.env.AUTH_DEMO_MODE !== "false";
  const staff = getDemoStaff();
  const docenti = listDocenti().map((d) => ({
    id: d.id,
    email: d.email,
    name: d.name,
    role: d.role,
  }));
  const googleReady = !!(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );

  return (
    <div className="login-page">
      <div className="login-card">
        <span className="login-kicker">CPIA</span>
        <h1>Sostituzioni docenti</h1>
        <p className="muted">
          Accedi per gestire o confermare le ore di sostituzione.
        </p>

        {demo && <DemoLoginForm staff={staff} docenti={docenti} />}

        {googleReady && (
          <form
            action={async () => {
              "use server";
              const { signIn } = await import("@/lib/auth");
              await signIn("google", { redirectTo: "/" });
            }}
            style={{ marginTop: "1rem" }}
          >
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%" }}
            >
              Accedi con Google
            </button>
          </form>
        )}

        {!demo && !googleReady && (
          <p className="muted">
            Nessun accesso configurato. Imposta AUTH_DEMO_MODE=true oppure le
            chiavi Google.
          </p>
        )}
      </div>
    </div>
  );
}
