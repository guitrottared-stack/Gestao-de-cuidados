"use client";

import { AlertTriangle } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DELAY_TOLERANCE_MINUTES, formatDelay, formatTimeOfDay, minutesLate } from "@/lib/status";
import type { TarefaComStatus } from "@/lib/types";

export function CurrentTaskCard({
  tarefa,
  onStart,
  onFinish,
  busy,
  now,
}: {
  tarefa: TarefaComStatus;
  onStart: () => void;
  onFinish: () => void;
  busy: boolean;
  now: Date;
}) {
  const late = tarefa.status === "ATRASADA" ? minutesLate(tarefa.horario_previsto, now) : 0;
  const iniciadaComAtraso =
    tarefa.status === "EM_ANDAMENTO" &&
    tarefa.execucao !== null &&
    tarefa.execucao.atraso_minutos > DELAY_TOLERANCE_MINUTES;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-teal-600">Agora</p>

      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-xl bg-teal-100 p-2.5 text-teal-700">
          <CategoryIcon category={tarefa.categoria} size={26} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold leading-tight text-slate-900">{tarefa.titulo}</h2>
          {tarefa.instrucoes && <p className="mt-1 text-sm text-slate-500">{tarefa.instrucoes}</p>}
        </div>
      </div>

      {tarefa.status === "ATRASADA" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          <AlertTriangle size={18} />
          Atrasada há {late} {late === 1 ? "minuto" : "minutos"}
        </div>
      )}

      {iniciadaComAtraso && tarefa.execucao && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
          <AlertTriangle size={18} />
          Iniciada com {formatDelay(tarefa.execucao.atraso_minutos)} de atraso.
        </div>
      )}

      <div className="mb-4">
        <StatusBadge status={tarefa.status} />
      </div>

      <div className="mb-5 space-y-1 text-sm text-slate-600">
        <p>Programada para {formatTimeOfDay(tarefa.horario_previsto)}</p>
        {tarefa.execucao?.inicio && <p>Iniciada às {formatTimeOfDay(tarefa.execucao.inicio)}</p>}
      </div>

      {tarefa.status !== "EM_ANDAMENTO" ? (
        <button
          onClick={onStart}
          disabled={busy}
          className="w-full rounded-xl bg-teal-600 py-4 text-lg font-bold text-white shadow-sm active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Iniciando..." : "INICIAR TAREFA"}
        </button>
      ) : (
        <button
          onClick={onFinish}
          disabled={busy}
          className="w-full rounded-xl bg-amber-500 py-4 text-lg font-bold text-white shadow-sm active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Finalizando..." : "FINALIZAR TAREFA"}
        </button>
      )}
    </div>
  );
}
