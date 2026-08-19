import type { BatchAlert, DisplayStatus, Execucao, Tarefa, TarefaComStatus } from "./types";

export const DELAY_TOLERANCE_MINUTES = 5;
/** Janela máxima entre registros para considerá-los "em lote" (minutos). */
const BATCH_WINDOW_MINUTES = 5;
/** Espalhamento mínimo dos horários previstos para acender o alerta (minutos). */
const BATCH_SPREAD_MINUTES = 60;

/** Data local no formato YYYY-MM-DD (fuso do dispositivo). */
export function todayDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Início e fim (exclusivo) do dia local de hoje, em ISO — para filtrar execuções por data. */
export function todayRangeISO(now: Date = new Date()): { startISO: string; endISO: string } {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

/** Combina a data de hoje com um horário "HH:MM" ou "HH:MM:SS" vindo do banco. */
export function scheduledDateTimeToday(horarioPrevisto: string, now: Date = new Date()): Date {
  const [h, m, s] = horarioPrevisto.split(":").map(Number);
  const result = new Date(now);
  result.setHours(h ?? 0, m ?? 0, s ?? 0, 0);
  return result;
}

/** inicio - horario_previsto (do dia de "inicio"), em minutos. Pode ser negativo. */
export function calcAtrasoMinutos(horarioPrevisto: string, inicio: Date): number {
  const scheduled = scheduledDateTimeToday(horarioPrevisto, inicio);
  return Math.round((inicio.getTime() - scheduled.getTime()) / 60000);
}

export function computeStatus(
  tarefa: Pick<Tarefa, "horario_previsto">,
  execucao: Execucao | null,
  now: Date = new Date()
): DisplayStatus {
  if (execucao) {
    if (execucao.status !== "CONCLUIDA") return "EM_ANDAMENTO";
    return execucao.atraso_minutos > DELAY_TOLERANCE_MINUTES ? "CONCLUIDA_COM_ATRASO" : "CONCLUIDA_NO_HORARIO";
  }
  const scheduled = scheduledDateTimeToday(tarefa.horario_previsto, now);
  return now.getTime() > scheduled.getTime() ? "ATRASADA" : "PENDENTE";
}

export function attachStatus(
  tarefas: Tarefa[],
  execucoes: Execucao[],
  now: Date = new Date()
): TarefaComStatus[] {
  const execucaoPorTarefa = new Map<string, Execucao>();
  for (const execucao of execucoes) {
    const existente = execucaoPorTarefa.get(execucao.tarefa_id);
    if (!existente || new Date(execucao.inicio) > new Date(existente.inicio)) {
      execucaoPorTarefa.set(execucao.tarefa_id, execucao);
    }
  }
  return tarefas.map((tarefa) => {
    const execucao = execucaoPorTarefa.get(tarefa.id) ?? null;
    return { ...tarefa, execucao, status: computeStatus(tarefa, execucao, now) };
  });
}

export function minutesLate(horarioPrevisto: string, now: Date = new Date()): number {
  const scheduled = scheduledDateTimeToday(horarioPrevisto, now);
  return Math.max(0, Math.floor((now.getTime() - scheduled.getTime()) / 60000));
}

export function formatTimeOfDay(value: string): string {
  // Aceita "HH:MM:SS" (colunas `time`) ou timestamps ISO.
  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Formata minutos de atraso como "12 minutos" ou "1h 20min". */
export function formatDelay(minutos: number): string {
  const abs = Math.abs(Math.round(minutos));
  if (abs < 60) return `${abs} ${abs === 1 ? "minuto" : "minutos"}`;
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function parseTimeToMinutes(horario: string): number {
  const [h, m] = horario.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Detecta possíveis registros retroativos em lote: 2+ execuções concluídas
 * com início e fim dentro de uma janela curta entre si, mas cujos horários
 * previstos estão espalhados por mais de 1h. Apenas um alerta visual — não
 * bloqueia o cuidador.
 */
export function detectBatchAlerts(
  execucoes: { inicio: string; fim: string | null; horario_previsto: string }[]
): BatchAlert[] {
  const concluidas = execucoes
    .filter((e): e is { inicio: string; fim: string; horario_previsto: string } => e.fim !== null)
    .map((e) => ({ inicioDate: new Date(e.inicio), inicio: e.inicio, horario_previsto: e.horario_previsto }))
    .sort((a, b) => a.inicioDate.getTime() - b.inicioDate.getTime());

  const alerts: BatchAlert[] = [];
  let cluster: typeof concluidas = [];

  const flushCluster = () => {
    if (cluster.length >= 2) {
      const previstoMinutos = cluster.map((c) => parseTimeToMinutes(c.horario_previsto));
      const spread = Math.max(...previstoMinutos) - Math.min(...previstoMinutos);
      if (spread > BATCH_SPREAD_MINUTES) {
        const ordenadoPorPrevisto = [...cluster].sort(
          (a, b) => parseTimeToMinutes(a.horario_previsto) - parseTimeToMinutes(b.horario_previsto)
        );
        alerts.push({
          quantidade: cluster.length,
          inicioMin: cluster[0].inicio,
          inicioMax: cluster[cluster.length - 1].inicio,
          previstoMin: ordenadoPorPrevisto[0].horario_previsto,
          previstoMax: ordenadoPorPrevisto[ordenadoPorPrevisto.length - 1].horario_previsto,
        });
      }
    }
    cluster = [];
  };

  for (const atual of concluidas) {
    const anterior = cluster[cluster.length - 1];
    if (anterior && (atual.inicioDate.getTime() - anterior.inicioDate.getTime()) / 60000 > BATCH_WINDOW_MINUTES) {
      flushCluster();
    }
    cluster.push(atual);
  }
  flushCluster();

  return alerts;
}
