import { AlertTriangle } from "lucide-react";
import { formatTimeOfDay } from "@/lib/status";
import type { BatchAlert } from "@/lib/types";

export function BatchAlertBanner({ alert }: { alert: BatchAlert }) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle size={16} />
        Possível registro retroativo em lote
      </p>
      <p className="mt-1">
        {alert.quantidade} tarefas registradas entre {formatTimeOfDay(alert.inicioMin)} e{" "}
        {formatTimeOfDay(alert.inicioMax)}, com horários previstos entre {formatTimeOfDay(alert.previstoMin)} e{" "}
        {formatTimeOfDay(alert.previstoMax)}.
      </p>
    </div>
  );
}
