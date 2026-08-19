import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function OverallStatusBanner({ haTarefaAtrasada }: { haTarefaAtrasada: boolean }) {
  if (haTarefaAtrasada) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
        <AlertTriangle className="text-red-800" size={26} />
        <span className="text-lg font-bold text-red-800">HÁ UMA TAREFA ATRASADA</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <CheckCircle2 className="text-emerald-800" size={26} />
      <span className="text-lg font-bold text-emerald-800">NENHUMA TAREFA PENDENTE</span>
    </div>
  );
}
