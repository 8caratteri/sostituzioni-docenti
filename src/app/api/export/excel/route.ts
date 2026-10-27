import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { expireOverdueAssignments } from "@/lib/expire";
import { isStaff } from "@/lib/slots";

export async function GET() {
  const session = await auth();
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  expireOverdueAssignments();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.name AS docente, s.date, s.start_time, s.end_time,
              s.classe_name, s.sede_name, s.importo_eur, a.status, a.is_ufficio
       FROM assignments a
       JOIN slots s ON s.id = a.slot_id
       JOIN users u ON u.id = a.docente_id
       WHERE a.status = 'confirmed'
       ORDER BY u.name, s.date, s.start_time`
    )
    .all() as Array<{
    docente: string;
    date: string;
    start_time: string;
    end_time: string;
    classe_name: string | null;
    sede_name: string | null;
    importo_eur: number;
    status: string;
    is_ufficio: number;
  }>;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Sostituzioni docenti CPIA";
  const sheet = wb.addWorksheet("Ore confermate");

  sheet.columns = [
    { header: "Docente", key: "docente", width: 22 },
    { header: "Data", key: "date", width: 12 },
    { header: "Inizio", key: "start", width: 10 },
    { header: "Fine", key: "end", width: 10 },
    { header: "Classe", key: "classe", width: 14 },
    { header: "Sede", key: "sede", width: 16 },
    { header: "Importo €", key: "importo", width: 12 },
    { header: "Tipo", key: "tipo", width: 14 },
  ];

  sheet.getRow(1).font = { bold: true };

  const totals = new Map<string, number>();
  let grand = 0;

  for (const r of rows) {
    sheet.addRow({
      docente: r.docente,
      date: r.date,
      start: r.start_time.slice(0, 5),
      end: r.end_time.slice(0, 5),
      classe: r.classe_name || "",
      sede: r.sede_name || "",
      importo: r.importo_eur,
      tipo: r.is_ufficio ? "d’ufficio" : "accettata",
    });
    totals.set(r.docente, (totals.get(r.docente) || 0) + r.importo_eur);
    grand += r.importo_eur;
  }

  sheet.addRow({});
  sheet.addRow({ docente: "Totali per docente" }).font = { bold: true };

  const sortedTeachers = [...totals.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], "it")
  );
  for (const [name, tot] of sortedTeachers) {
    sheet.addRow({ docente: name, importo: tot });
  }

  sheet.addRow({});
  const grandRow = sheet.addRow({
    docente: "Totale generale",
    importo: grand,
  });
  grandRow.font = { bold: true };

  sheet.getColumn("importo").numFmt = '#,##0.00';

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="sostituzioni-confermate.xlsx"',
    },
  });
}
