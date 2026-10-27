import { redirect } from "next/navigation";
import { auth, getDemoUsers, signIn } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const demo = process.env.AUTH_DEMO_MODE !== "false";
  const users = getDemoUsers();
  const googleReady = !!(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Sostituzioni docenti</h1>
        <p className="muted">
          Accedi per gestire o confermare le ore di sostituzione.
        </p>

        {demo && (
          <>
            <p className="small" style={{ marginTop: "1rem" }}>
              Modalità prova — scegli un utente:
            </p>
            <div className="demo-list">
              {users.map((u) => (
                <form
                  key={u.id}
                  action={async () => {
                    "use server";
                    await signIn("demo", {
                      userId: u.id,
                      redirectTo: "/",
                    });
                  }}
                >
                  <button type="submit">
                    {u.name}
                    <span className="role">
                      {u.role === "segreteria"
                        ? "Segreteria"
                        : u.role === "dirigente"
                          ? "Dirigente"
                          : "Docente"}
                    </span>
                  </button>
                </form>
              ))}
            </div>
          </>
        )}

        {googleReady && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
            style={{ marginTop: "1rem" }}
          >
            <button type="submit" className="btn-primary" style={{ width: "100%" }}>
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
