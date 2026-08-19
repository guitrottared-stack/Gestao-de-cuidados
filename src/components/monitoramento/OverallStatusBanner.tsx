import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

export type OverallLevel = "ok" | "atencao" | "critico";

const CONFIG: Record<OverallLevel, { bg: string; text: string; label: string; icon: typeof CheckCircle2 }> = {
  ok: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", label: "ROTINA EM DIA", icon: CheckCircle2 },
  atencao: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    label: "EXISTEM TAREFAS ATRASADAS",
    icon: AlertTriangle,
  },
  critico: { bg: "bg-red-50 border-red-200", text: "text-red-800", label: "ATENÇÃO", icon: AlertCircle },
};

export function OverallStatusBanner({ level }: { level: OverallLevel }) {
  const config = CONFIG[level];
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${config.bg}`}>
      <Icon className={config.text} size={26} />
      <span className={`text-lg font-bold ${config.text}`}>{config.label}</span>
    </div>
  );
}
