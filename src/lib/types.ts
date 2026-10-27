export type Role = "segreteria" | "dirigente" | "docente";

export type VisaStatus = "awaiting" | "approved" | "rejected";

export type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "refused"
  | "expired"
  | "cancelled";

export type SlotStatus = "open" | "assigned" | "closed";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: number;
  created_at: string;
}

export interface ClasseRow {
  id: number;
  name: string;
  created_at: string;
}

export interface SedeRow {
  id: number;
  name: string;
  created_at: string;
}

export interface DisponibilitaRow {
  id: number;
  user_id: string;
  label: string;
  created_at: string;
}

export interface BudgetRow {
  id: number;
  total_eur: number;
  tariff_eur: number;
  updated_at: string;
}

export interface SlotRow {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  classe_id: number | null;
  sede_id: number | null;
  classe_name: string | null;
  sede_name: string | null;
  note: string | null;
  motivo: string | null;
  importo_eur: number;
  visa_status: VisaStatus;
  visa_note: string | null;
  created_by: string;
  created_role: Role;
  created_at: string;
}

export interface AssignmentRow {
  id: number;
  slot_id: number;
  docente_id: string;
  status: AssignmentStatus;
  is_ufficio: number;
  assigned_by: string;
  assigned_at: string;
  confirm_deadline: string | null;
  responded_at: string | null;
}

export interface SlotListItem extends SlotRow {
  creator_name: string;
  assignment_id: number | null;
  assignment_status: AssignmentStatus | null;
  is_ufficio: number | null;
  confirm_deadline: string | null;
  docente_id: string | null;
  docente_name: string | null;
  assigned_at: string | null;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
