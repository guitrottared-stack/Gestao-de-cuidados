import type { DisplayStatus, Task, TaskExecution, TaskWithStatus } from "./types";

/** Data local no formato YYYY-MM-DD (fuso do dispositivo). */
export function todayDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Combina a data de hoje com um horário "HH:MM" ou "HH:MM:SS" vindo do banco. */
export function scheduledDateTimeToday(scheduledTime: string, now: Date = new Date()): Date {
  const [h, m, s] = scheduledTime.split(":").map(Number);
  const result = new Date(now);
  result.setHours(h ?? 0, m ?? 0, s ?? 0, 0);
  return result;
}

export function computeStatus(
  task: Pick<Task, "scheduled_time">,
  execution: TaskExecution | null,
  now: Date = new Date()
): DisplayStatus {
  if (execution) {
    return execution.status === "CONCLUIDA" ? "CONCLUIDA" : "EM_ANDAMENTO";
  }
  const scheduled = scheduledDateTimeToday(task.scheduled_time, now);
  return now.getTime() > scheduled.getTime() ? "ATRASADA" : "PENDENTE";
}

export function attachStatus(tasks: Task[], executions: TaskExecution[], now: Date = new Date()): TaskWithStatus[] {
  const executionByTask = new Map<string, TaskExecution>();
  for (const execution of executions) {
    const existing = executionByTask.get(execution.task_id);
    if (!existing || new Date(execution.started_at) > new Date(existing.started_at)) {
      executionByTask.set(execution.task_id, execution);
    }
  }
  return tasks.map((task) => {
    const execution = executionByTask.get(task.id) ?? null;
    return { ...task, execution, status: computeStatus(task, execution, now) };
  });
}

export function minutesLate(scheduledTime: string, now: Date = new Date()): number {
  const scheduled = scheduledDateTimeToday(scheduledTime, now);
  return Math.max(0, Math.floor((now.getTime() - scheduled.getTime()) / 60000));
}

export function formatTimeOfDay(value: string): string {
  // Aceita "HH:MM:SS" (colunas `time`) ou timestamps ISO.
  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
