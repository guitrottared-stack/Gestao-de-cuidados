import { AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryIcon } from "@/components/CategoryIcon";
import { formatDelay, formatTimeOfDay, minutesLate } from "@/lib/status";
import type { TarefaComStatus } from "@/lib/types";

export function TaskRow({ tarefa, now }: { tarefa: TarefaComStatus; now: Date }) {
  const isLate = tarefa.status === "ATRASADA";
  const late = isLate ? minutesLate(tarefa.horario_previsto, now) : 0;

  return (
    <li className={`rounded-xl border p-4 ${isLate ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        <span className="w-12 shrink-0 pt-0.5 text-sm font-bold text-slate-500">
          {formatTimeOfDay(tarefa.horario_previsto)}
        </span>
        <span className={`shrink-0 ${isLate ? "text-red-600" : "text-slate-400"}`}>
          <CategoryIcon category={tarefa.categoria} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{tarefa.titulo}</p>
          <div className="mt-1.5">
            <StatusBadge status={tarefa.status} size="sm" />
          </div>
          {(tarefa.execucao?.inicio || tarefa.execucao?.fim) && (
            <div className="mt-1.5 space-y-0.5 text-xs text-slate-500">
              {tarefa.execucao?.inicio && <p>Início: {formatTimeOfDay(tarefa.execucao.inicio)}</p>}
              {tarefa.execucao?.fim && <p>Fim: {formatTimeOfDay(tarefa.execucao.fim)}</p>}
            </div>
          )}
          {tarefa.status === "CONCLUIDA_COM_ATRASO" && tarefa.execucao && (
            <p className="mt-1 text-xs font-medium text-orange-700">
              Iniciada com {formatDelay(tarefa.execucao.atraso_minutos)} de atraso.
            </p>
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
