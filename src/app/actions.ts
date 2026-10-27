"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getBudgetSummary, updateBudget } from "@/lib/budget";
import {
  addClasse,
  addSede,
  deleteClasse,
  deleteSede,
  removeDisponibilita,
  setDisponibilita,
} from "@/lib/catalog";
import { isStaff } from "@/lib/slots";
import {
  assignTeacher,
  createSlot,
  deleteSlot,
  removeAssignment,
  setVisa,
  teacherPropose,
  teacherRespond,
} from "@/lib/slots";
import type { Role } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/", "layout");
}

async function requireRole(...roles: Role[]) {
  const user = await requireSession();
  if (!roles.includes(user.role)) {
    throw new Error("Non autorizzato");
  }
  return user;
}

export async function actionCreateSlot(formData: FormData) {
  const user = await requireRole("segreteria", "dirigente");
  const date = String(formData.get("date") || "");
  const start_time = String(formData.get("start_time") || "");
  const end_time = String(formData.get("end_time") || "");
  const classe_id = formData.get("classe_id")
    ? Number(formData.get("classe_id"))
    : null;
  const sede_id = formData.get("sede_id")
    ? Number(formData.get("sede_id"))
    : null;
  const note = String(formData.get("note") || "") || null;
  const motivo = String(formData.get("motivo") || "") || null;

  if (!date || !start_time || !end_time) {
    throw new Error("Data e orario obbligatori");
  }

  createSlot({
    date,
    start_time,
    end_time,
    classe_id,
    sede_id,
    note,
    motivo,
    actor: user,
  });
  revalidateAll();
  redirect("/admin");
}

export async function actionVisa(formData: FormData) {
  await requireRole("dirigente");
  const slotId = Number(formData.get("slot_id"));
  const decision = String(formData.get("decision"));
  const note = String(formData.get("note") || "") || null;
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Decisione non valida");
  }
  setVisa(slotId, decision, note);
  revalidateAll();
}

export async function actionDeleteSlot(formData: FormData) {
  await requireRole("segreteria", "dirigente");
  const slotId = Number(formData.get("slot_id"));
  deleteSlot(slotId);
  revalidateAll();
}

export async function actionAssign(formData: FormData) {
  const user = await requireRole("segreteria", "dirigente");
  const slotId = Number(formData.get("slot_id"));
  const docenteId = String(formData.get("docente_id") || "");
  if (!docenteId) throw new Error("Scegli un docente");
  assignTeacher({ slotId, docenteId, actor: user });
  revalidateAll();
}

export async function actionRemove(formData: FormData) {
  const user = await requireRole("segreteria", "dirigente");
  const slotId = Number(formData.get("slot_id"));
  removeAssignment(slotId, user);
  revalidateAll();
}

export async function actionUpdateBudget(formData: FormData) {
  await requireRole("segreteria", "dirigente");
  const total = Number(formData.get("total_eur"));
  const tariff = Number(formData.get("tariff_eur"));
  if (!(total >= 0) || !(tariff >= 0)) {
    throw new Error("Importi non validi");
  }
  updateBudget(total, tariff);
  revalidateAll();
}

export async function actionAddClasse(formData: FormData) {
  await requireRole("segreteria", "dirigente");
  addClasse(String(formData.get("name") || ""));
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

export async function actionSetDisponibilita(formData: FormData) {
  await requireRole("segreteria", "dirigente");
  const userId = String(formData.get("user_id") || "");
  const label = String(formData.get("label") || "");
  setDisponibilita(userId, label);
  revalidateAll();
}

export async function actionRemoveDisponibilita(formData: FormData) {
  await requireRole("segreteria", "dirigente");
  removeDisponibilita(String(formData.get("user_id") || ""));
  revalidateAll();
}

export async function actionTeacherRespond(formData: FormData) {
  const user = await requireRole("docente");
  const assignmentId = Number(formData.get("assignment_id"));
  const decision = String(formData.get("decision"));
  teacherRespond(assignmentId, user.id, decision === "accept");
  revalidateAll();
}

export async function actionTeacherPropose(formData: FormData) {
  const user = await requireRole("docente");
  const slotId = Number(formData.get("slot_id"));
  teacherPropose(slotId, user.id);
  revalidateAll();
}

export async function getBudgetForPage() {
  const user = await requireSession();
  if (!isStaff(user.role)) throw new Error("Non autorizzato");
  return getBudgetSummary();
}
