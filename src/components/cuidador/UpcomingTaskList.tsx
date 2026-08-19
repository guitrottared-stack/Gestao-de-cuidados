import { CategoryIcon } from "@/components/CategoryIcon";
import { formatTimeOfDay } from "@/lib/status";
import type { TarefaComStatus } from "@/lib/types";

export function UpcomingTaskList({ tarefas }: { tarefas: TarefaComStatus[] }) {
  if (tarefas.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Próximas tarefas</h2>
      <ul className="space-y-2">
        {tarefas.map((tarefa) => (
          <li key={tarefa.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="w-12 shrink-0 text-sm font-semibold text-slate-500">
              {formatTimeOfDay(tarefa.horario_previsto)}
            </span>
            <span className="text-slate-400">
              <CategoryIcon category={tarefa.categoria} size={20} />
            </span>
            <span className="truncate text-sm font-medium text-slate-800">{tarefa.titulo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
