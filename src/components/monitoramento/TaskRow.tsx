import { AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatTimeOfDay, minutesLate } from "@/lib/status";
import type { TaskWithStatus } from "@/lib/types";

export function TaskRow({ task, now }: { task: TaskWithStatus; now: Date }) {
  const isLate = task.status === "ATRASADA";
  const late = isLate ? minutesLate(task.scheduled_time, now) : 0;

  return (
    <li
      className={`rounded-xl border p-4 ${
        isLate ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="w-12 shrink-0 pt-0.5 text-sm font-bold text-slate-500">
          {formatTimeOfDay(task.scheduled_time)}
        </span>
        <span className={`shrink-0 ${isLate ? "text-red-600" : "text-slate-400"}`}>
          <CategoryIcon category={task.category} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{task.title}</p>
          <div className="mt-1.5">
            <StatusBadge status={task.status} delayed={task.execution?.is_delayed} size="sm" />
          </div>
          {(task.execution?.started_at || task.execution?.completed_at) && (
            <div className="mt-1.5 space-y-0.5 text-xs text-slate-500">
              {task.execution?.started_at && <p>Início: {formatTimeOfDay(task.execution.started_at)}</p>}
              {task.execution?.completed_at && <p>Fim: {formatTimeOfDay(task.execution.completed_at)}</p>}
            </div>
          )}
          {isLate && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-700">
              <AlertTriangle size={13} />
              Atrasada há {late} {late === 1 ? "minuto" : "minutos"}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
