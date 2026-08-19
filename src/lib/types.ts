export type TaskCategory =
  | "dieta"
  | "higiene"
  | "medicacao"
  | "higiene_oral"
  | "inalacao"
  | "mudanca_decubito"
  | "agua"
  | "hidratacao"
  | "exercicios"
  | "banho"
  | "banho_sol"
  | "estimulacao";

export type Turno = "diurno" | "noturno";

export interface Patient {
  id: string;
  name: string;
}

export interface Caregiver {
  id: string;
  name: string;
}

export interface Shift {
  id: string;
  patient_id: string;
  caregiver_id: string;
  start_time: string;
  end_time: string;
  date: string;
}

export interface Task {
  id: string;
  patient_id: string;
  scheduled_time: string;
  title: string;
  category: TaskCategory;
  instructions: string | null;
  sort_order: number;
  active: boolean;
}

export type TaskExecutionStatus = "EM_ANDAMENTO" | "CONCLUIDA";

export interface TaskExecution {
  id: string;
  task_id: string;
  shift_id: string;
  started_at: string;
  completed_at: string | null;
  status: TaskExecutionStatus;
  is_delayed: boolean;
}

/** Status exibido na UI, incluindo os derivados (PENDENTE/ATRASADA) que não são persistidos. */
export type DisplayStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA";

export interface TaskWithStatus extends Task {
  execution: TaskExecution | null;
  status: DisplayStatus;
}
