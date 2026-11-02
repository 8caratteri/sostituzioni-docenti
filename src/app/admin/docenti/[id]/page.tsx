import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DateIt } from "@/components/DateIt";
import { AssignmentBadge, VisaBadge } from "@/components/StatusBadges";
import { auth } from "@/lib/auth";
import { formatEuro, formatSlotOra } from "@/lib/format";
import { canManageTeachers } from "@/lib/permissions";
import {
  getTeacherWithRecupero,
  groupTeacherAssignments,
  listTeacherAssignments,
} from "@/lib/slots";

export default async function DocenteSchedaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canManageTeachers(session.user.role)) {
    redirect("/admin");
  }
  const { id } = await params;
  const teacher = getTeacherWithRecupero(id);
  if (!teacher) notFound();

  const rows = listTeacherAssignments(id);
  const { inCorso, future, svolte } = groupTeacherAssignments(rows);

  function Section({
    title,
    items,
    empty,
  }: {
    title: string;
    items: typeof rows;
    empty: string;
  }) {
    return (
      <section className="docente-ore-section">
        <h2>{title}</h2>
        {items.length === 0 ? (
          <p className="muted small">{empty}</p>
        ) : (
          <ul className="docente-ore-list">
            {items.map((r) => (
              <li key={r.id} className="card docente-ore-row">
                <div className="docente-ore-main">
                  <div className="docente-ore-title">
                    <DateIt date={r.date} /> ·{" "}
                    {formatSlotOra(
                      r.start_time,
                      r.sede_name,
                      r.classe_name,
                      r.ora
                    )}
                  </div>
                  <div className="muted small">
                    {r.sede_name || "—"}
                    {r.classe_name ? ` · ${r.classe_name}` : ""}
                  </div>
                </div>
                <div className="docente-ore-meta">
                  <VisaBadge status={r.visa_status} />
                  <AssignmentBadge
                    status={r.status}
                    isUfficio={r.is_ufficio}
                    visaStatus={r.visa_status}
                  />
                  <span className="small">
                    {r.is_recupero
                      ? "Recupero · 0 €"
                      : formatEuro(r.importo_eur)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <>
      <p>
        <Link href="/admin/docenti">Torna ai docenti</Link>
      </p>
      <h1>{teacher.name}</h1>
      <p className="page-lead">
        {teacher.email} · Ore recupero: {teacher.ore_recupero}
      </p>
      <Section title="In corso" items={inCorso} empty="Nessuna ora in corso." />
      <Section title="Future" items={future} empty="Nessuna ora futura." />
      <Section title="Svolte / chiuse" items={svolte} empty="Nessuna ora chiusa." />
    </>
  );
}
