import type { Role } from "./types";

export function isStaff(role: Role): boolean {
  return (
    role === "segreteria" ||
    role === "vicepreside" ||
    role === "dirigente"
  );
}

export function canManageClassi(role: Role): boolean {
  return role === "segreteria" || role === "dirigente";
}

export function canManageCatalog(role: Role): boolean {
  return canManageClassi(role);
}

export function canDeleteSlot(role: Role): boolean {
  return role === "vicepreside" || role === "dirigente";
}

export function canManageBudget(role: Role): boolean {
  return role === "segreteria" || role === "dirigente";
}

export function canCreateSlot(role: Role): boolean {
  return role === "vicepreside" || role === "dirigente";
}

export function canAssign(role: Role): boolean {
  return role === "vicepreside" || role === "dirigente";
}

export function canVisa(role: Role): boolean {
  return role === "dirigente";
}

export function canManageTeachers(role: Role): boolean {
  return role === "vicepreside" || role === "dirigente";
}

export function canManageDisponibilita(role: Role): boolean {
  return role === "vicepreside" || role === "dirigente";
}

export function canExport(role: Role): boolean {
  return isStaff(role);
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "segreteria":
      return "Segreteria";
    case "vicepreside":
      return "Vicepreside";
    case "dirigente":
      return "Preside";
    case "docente":
      return "Docente";
  }
}
