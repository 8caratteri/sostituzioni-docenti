export type Role = "segreteria" | "vicepreside" | "dirigente" | "docente";

export type VisaStatus = "awaiting" | "approved" | "rejected";

export type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "refused"
  | "expired"
  | "cancelled";

export type PropostaStatus = "pending" | "accepted" | "withdrawn" | "rejected";

export type Fascia = "mattina" | "pomeriggio";

export type Weekday = 1 | 2 | 3 | 4 | 5;

export type OraDidattica = 1 | 2 | 3 | 4 | 5;

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: number;
  created_at: string;
}

export interface SedeRow {
  id: number;
  name: string;
  fascia_default: Fascia | "mista";
  created_at: string;
}

export interface ClasseRow {
  id: number;
  name: string;
  sede_id: number;
  fascia: Fascia;
  created_at: string;
}

export interface DisponibilitaOraRow {
  id: number;
  user_id: string;
  sede_id: number;
  fascia: Fascia;
  weekday: number;
  ora: number;
}

export interface RecuperoRow {
  user_id: string;
  ore: number;
  updated_at: string;
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
  ora: number;
  fascia: Fascia;
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
  is_recupero: number;
  refuse_motivo: string | null;
  assigned_by: string;
  assigned_at: string;
  confirm_deadline: string | null;
  responded_at: string | null;
}

export interface PropostaRow {
  id: number;
  slot_id: number;
  docente_id: string;
  status: PropostaStatus;
  created_at: string;
}

export interface SlotListItem extends SlotRow {
  creator_name: string;
  assignment_id: number | null;
  assignment_status: AssignmentStatus | null;
  is_ufficio: number | null;
  is_recupero: number | null;
  refuse_motivo: string | null;
  confirm_deadline: string | null;
  docente_id: string | null;
  docente_name: string | null;
  assigned_at: string | null;
  proposte_count: number;
  last_refuse_motivo?: string | null;
  last_refuse_docente_name?: string | null;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Candidato {
  id: string;
  name: string;
  email: string;
  ore_recupero: number;
  available: boolean;
  priority: boolean;
}

export type TeacherAssignOption = {
  id: string;
  name: string;
  email: string;
  ore_recupero: number;
  priority: boolean;
};
