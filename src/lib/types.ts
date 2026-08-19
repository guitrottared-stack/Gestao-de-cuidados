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

export type TipoUsuario = "cuidador" | "familia";

export interface Paciente {
  id: string;
  nome: string;
}

/** Perfil de um usuário autenticado (id = auth.users.id). */
export interface Usuario {
  id: string;
  nome: string;
  tipo: TipoUsuario;
}

export interface Tarefa {
  id: string;
  paciente_id: string;
  horario_previsto: string;
  titulo: string;
  categoria: TaskCategory;
  instrucoes: string | null;
  ordem: number;
  ativo: boolean;
}

export type ExecucaoStatus = "EM_ANDAMENTO" | "CONCLUIDA";

export interface Execucao {
  id: string;
  tarefa_id: string;
  cuidador_id: string;
  inicio: string;
  fim: string | null;
  status: ExecucaoStatus;
  /** inicio - horario_previsto, em minutos. Pode ser negativo (iniciada antes do horário). */
  atraso_minutos: number;
}

/** Status exibido na UI. PENDENTE e ATRASADA são derivados (não persistidos). */
export type DisplayStatus =
  | "PENDENTE"
  | "EM_ANDAMENTO"
  | "ATRASADA"
  | "CONCLUIDA_NO_HORARIO"
  | "CONCLUIDA_COM_ATRASO";

export interface TarefaComStatus extends Tarefa {
  execucao: Execucao | null;
  status: DisplayStatus;
}

export interface BatchAlert {
  quantidade: number;
  inicioMin: string;
  inicioMax: string;
  previstoMin: string;
  previstoMax: string;
}
