"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { getBudgetSummary, updateBudget } from "@/lib/budget";
import {
  addClasse,
  addDocente,
  addSede,
  deleteClasse,
  deleteDocente,
  deleteSede,
  setDisponibilitaOre,
  toggleDisponibilitaCell,
} from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { setOreRecupero as setRecuperoPagamento } from "@/lib/pagamento";
import { markNavSeen, type NavChannel } from "@/lib/notifications";
import {
  canAssign,
  canDeleteSlot,
  canManageBudget,
  canManageDisponibilita,
} from "@/lib/permissions";
import {
  acceptProposta,
  rejectProposta,
  teacherPropose,
} from "@/lib/proposte";
import { clockForOra } from "@/lib/slot-time";
import {
  assignTeacher,
  createSlot,
  deleteSlot,
  removeAssignment,
  setVisa,
  teacherRespond,
} from "@/lib/slots";
import type { Fascia, Role } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/", "layout");
}

async function requireRole(...roles: Role[]) {
  const user = await requireSession();
  if (!roles.includes(user.role)) throw new Error("Non autorizzato");
  return user;
}

export async function actionCreateSlot(formData: FormData) {
  const user = await requireRole("vicepreside", "dirigente");
  const date = String(formData.get("date") || "");
  const oraRaw = Number(formData.get("ora"));
  const classe_id = formData.get("classe_id")
    ? Number(formData.get("classe_id"))
    : null;
  const sede_id = formData.get("sede_id")
    ? Number(formData.get("sede_id"))
    : null;
  const note = String(formData.get("note") || "") || null;
  const motivo = String(formData.get("motivo") || "") || null;

  if (!date) throw new Error("Data obbligatoria");
  if (!oraRaw || oraRaw < 1 || oraRaw > 5) {
    throw new Error("Ora didattica obbligatoria (1–5)");
  }
  if (!sede_id || !classe_id) throw new Error("Plesso e classe obbligatori");

  const db = getDb();
  const sede = db
    .prepare(`SELECT name FROM sedi WHERE id = ?`)
    .get(sede_id) as { name: string } | undefined;
  const classe = db
    .prepare(`SELECT name, fascia FROM classi WHERE id = ?`)
    .get(classe_id) as { name: string; fascia: Fascia } | undefined;
  if (!sede || !classe) throw new Error("Plesso o classe non validi");

  const clock = clockForOra(classe.fascia, oraRaw);
  const tariff = (
    db.prepare(`SELECT tariff_eur FROM budget WHERE id = 1`).get() as {
      tariff_eur: number;
    }
  ).tariff_eur;

  createSlot({
    date,
    start_time: clock.start,
    end_time: clock.end,
    ora: oraRaw,
    fascia: classe.fascia,
    classe_id,
    sede_id,
    classe_name: classe.name,
    sede_name: sede.name,
    note,
    motivo,
    importo_eur: tariff,
    actor: user,
  });
  revalidateAll();
}

export async function actionVisa(formData: FormData) {
  const user = await requireRole("dirigente");
  const slotId = Number(formData.get("slot_id"));
  const decision = String(formData.get("decision"));
  const note = String(formData.get("note") || "") || null;
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Decisione non valida");
  }
  setVisa(slotId, decision, note);
  markNavSeen(user.id, "elenco");
  revalidateAll();
}

export async function actionDeleteSlot(formData: FormData) {
  const user = await requireRole("vicepreside", "dirigente");
  if (!canDeleteSlot(user.role)) throw new Error("Non autorizzato");
  deleteSlot(Number(formData.get("slot_id")));
  revalidateAll();
}

export async function actionAssign(formData: FormData) {
  const user = await requireRole("vicepreside", "dirigente");
  if (!canAssign(user.role)) throw new Error("Non autorizzato");
  const docenteId = String(formData.get("docente_id") || "");
  const allowOutside =
    String(formData.get("allow_outside") || "") === "1" ||
    String(formData.get("allow_outside") || "") === "true";
  if (!docenteId) throw new Error("Scegli un docente");
  assignTeacher({
    slotId: Number(formData.get("slot_id")),
    docenteId,
    actor: user,
    allowOutsideDisponibilita: allowOutside,
  });
  markNavSeen(user.id, "elenco");
  revalidateAll();
}

export async function actionRemove(formData: FormData) {
  const user = await requireRole("vicepreside", "dirigente");
  removeAssignment(Number(formData.get("slot_id")), user);
  markNavSeen(user.id, "elenco");
  revalidateAll();
}

export async function actionUpdateBudget(formData: FormData) {
  await requireRole("segreteria", "dirigente");
  updateBudget(
    Number(formData.get("total_eur")),
    Number(formData.get("tariff_eur"))
  );
  revalidateAll();
}

export async function actionAddClasse(formData: FormData) {
  await requireRole("segreteria", "dirigente");
  addClasse(
    String(formData.get("name") || ""),
    Number(formData.get("sede_id")),
    String(formData.get("fascia") || "mattina") as "mattina" | "pomeriggio"
  );
  revalidateAll();
}

export async function actionDeleteClasse(formData: FormData) {
  await requireRole("segreteria", "dirigente");
  deleteClasse(Number(formData.get("id")));
  revalidateAll();
}

export async function actionAddSede(formData: FormData) {
  await requireRole("segreteria", "dirigente");
  addSede(String(formData.get("name") || ""));
  revalidateAll();
}

export async function actionDeleteSede(formData: FormData) {
  await requireRole("segreteria", "dirigente");
  deleteSede(Number(formData.get("id")));
  revalidateAll();
}

export async function actionToggleDisponibilita(formData: FormData) {
  const user = await requireRole("vicepreside", "dirigente");
  if (!canManageDisponibilita(user.role)) throw new Error("Non autorizzato");
  toggleDisponibilitaCell({
    userId: String(formData.get("user_id") || ""),
    sedeId: Number(formData.get("sede_id")),
    fascia: String(formData.get("fascia") || "mattina") as
      | "mattina"
      | "pomeriggio",
    weekday: Number(formData.get("weekday")),
    ora: Number(formData.get("ora")),
  });
  revalidateAll();
}

export async function actionSetRecupero(formData: FormData) {
  await requireRole("vicepreside", "dirigente");
  setRecuperoPagamento(
    String(formData.get("user_id") || ""),
    Number(formData.get("ore") || formData.get("ore_recupero") || 0)
  );
  revalidateAll();
}

export async function actionSaveDisponibilita(formData: FormData) {
  await requireRole("vicepreside", "dirigente");
  const userId = String(formData.get("user_id") || "");
  let cells: {
    sede_id: number;
    fascia: "mattina" | "pomeriggio";
    weekday: number;
    ora: number;
  }[] = [];
  try {
    cells = JSON.parse(String(formData.get("cells") || "[]"));
  } catch {
    throw new Error("Dati disponibilità non validi");
  }
  setDisponibilitaOre(userId, cells);
  revalidateAll();
}

export async function actionAddDocente(formData: FormData) {
  await requireRole("vicepreside", "dirigente");
  addDocente(
    String(formData.get("name") || ""),
    String(formData.get("email") || "") || null
  );
  revalidateAll();
}

export async function actionCreateDocente(formData: FormData) {
  return actionAddDocente(formData);
}

export async function actionUpdateDocente(formData: FormData) {
  await requireRole("vicepreside", "dirigente");
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const active = String(formData.get("active") || "1") !== "0";
  if (!id || !name || !email) throw new Error("Dati docente incompleti");
  getDb()
    .prepare(
      `UPDATE users SET name = ?, email = ?, active = ? WHERE id = ? AND role = 'docente'`
    )
    .run(name, email, active ? 1 : 0, id);
  revalidateAll();
}

export async function actionDeleteDocente(formData: FormData) {
  await requireRole("vicepreside", "dirigente");
  deleteDocente(String(formData.get("id") || ""));
  revalidateAll();
}

export async function actionTeacherRespond(formData: FormData) {
  const user = await requireRole("docente");
  const decision = String(formData.get("decision"));
  teacherRespond(
    Number(formData.get("assignment_id")),
    user.id,
    decision === "accept",
    decision === "refuse" ? String(formData.get("refuse_motivo") || "") : null
  );
  markNavSeen(user.id, "mie-ore");
  revalidateAll();
}

export async function actionTeacherPropose(formData: FormData) {
  const user = await requireRole("docente");
  teacherPropose(Number(formData.get("slot_id")), user.id);
  revalidateAll();
}

export async function actionAcceptProposta(formData: FormData) {
  const user = await requireRole("vicepreside", "dirigente");
  acceptProposta(Number(formData.get("proposta_id")), user);
  markNavSeen(user.id, "elenco");
  revalidateAll();
}

export async function actionRejectProposta(formData: FormData) {
  const user = await requireRole("vicepreside", "dirigente");
  rejectProposta(Number(formData.get("proposta_id")), user);
  markNavSeen(user.id, "elenco");
  revalidateAll();
}

export async function actionMarkNavSeen(channel: NavChannel) {
  const user = await requireSession();
  if (channel !== "elenco" && channel !== "mie-ore") {
    throw new Error("Canale non valido");
  }
  if (channel === "elenco") {
    if (user.role !== "vicepreside" && user.role !== "dirigente") return;
  }
  if (channel === "mie-ore" && user.role !== "docente") return;
  markNavSeen(user.id, channel);
  revalidateAll();
}

export async function getBudgetForPage() {
  const user = await requireSession();
  if (!canManageBudget(user.role)) throw new Error("Non autorizzato");
  return getBudgetSummary();
}

export async function actionDemoLogin(formData: FormData) {
  const { signIn } = await import("@/lib/auth");
  const userId = String(formData.get("userId") || "");
  await signIn("demo", { userId, redirectTo: "/" });
}
