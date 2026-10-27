import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/slots";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (isStaff(session.user.role)) redirect("/admin");
  redirect("/docente");
}
