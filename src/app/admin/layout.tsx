import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StaffNav } from "@/components/StaffNav";
import { isStaff, listAwaitingVisa } from "@/lib/slots";
import { getDb } from "@/lib/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  getDb();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isStaff(session.user.role)) redirect("/docente");

  const user = {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name || "",
    role: session.user.role,
  };

  const awaiting =
    user.role === "dirigente" ? listAwaitingVisa().length : 0;

  return (
    <>
      <StaffNav user={user} awaitingCount={awaiting} />
      <main>{children}</main>
    </>
  );
}
