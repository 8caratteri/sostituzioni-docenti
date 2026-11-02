import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StaffNav } from "@/components/StaffNav";
import { getDb } from "@/lib/db";
import { navBadgeFor } from "@/lib/notifications";
import { isStaff } from "@/lib/permissions";

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

  const badgeCount = navBadgeFor(user.role, user.id);

  return (
    <>
      <StaffNav user={user} badgeCount={badgeCount} />
      <main>{children}</main>
    </>
  );
}
