import { redirect } from "next/navigation";

/** Il visto è inline nell'Elenco (CPIA-43). */
export default function VistoRedirectPage() {
  redirect("/admin");
}
