import Link from "next/link";
import { redirect } from "next/navigation";
import { DisponibilitaEditor } from "@/components/DisponibilitaEditor";
import { auth } from "@/lib/auth";
import { listDocenti, listSedi } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { getOreRecupero } from "@/lib/pagamento";
import { canManageDisponibilita } from "@/lib/permissions";

export default async function DisponibilitaPage() {
  const session = await auth();
  if (!session?.user || !canManageDisponibilita(session.user.role)) {
    redirect("/admin");
  }

  const teachers = listDocenti().map((t) => ({
    id: t.id,
    name: t.name,
    ore_recupero: getOreRecupero(t.id),
  }));
  const sedi = listSedi();
  const cells = getDb()
    .prepare(
      `SELECT user_id, sede_id, fascia, weekday, ora FROM disponibilita_ore`
    )
    .all() as {
    user_id: string;
    sede_id: number;
    fascia: "mattina" | "pomeriggio";
    weekday: number;
    ora: number;
  }[];

  return (
    <>
      <p>
        <Link href="/admin">Torna all&apos;elenco</Link>
      </p>
      <h1>Disponibilità</h1>
      <p className="page-lead">
        Seleziona un docente e tocca le ore (1–5) per plesso e giorno.
      </p>
      <DisponibilitaEditor teachers={teachers} sedi={sedi} cells={cells} />
    </>
  );
}
