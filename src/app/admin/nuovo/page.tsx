import Link from "next/link";
import { redirect } from "next/navigation";
import { NuovoSlotForm } from "@/components/NuovoSlotForm";
import { auth } from "@/lib/auth";
import { listClassi, listSedi } from "@/lib/catalog";
import { canCreateSlot } from "@/lib/permissions";

export default async function NuovoSlotPage() {
  const session = await auth();
  if (!session?.user || !canCreateSlot(session.user.role)) {
    redirect("/admin");
  }

  return (
    <>
      <p>
        <Link href="/admin">Torna all&apos;elenco</Link>
      </p>
      <h1>Nuovo slot</h1>
      <p className="page-lead">
        Scegli la data dal calendario, poi plesso, classe e ora didattica (1–5).
      </p>
      <NuovoSlotForm sedi={listSedi()} classi={listClassi()} />
    </>
  );
}
