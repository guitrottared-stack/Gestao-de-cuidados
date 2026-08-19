import type { DisplayStatus } from "@/lib/types";

const STATUS_CONFIG: Record<DisplayStatus, { label: string; dot: string; text: string; bg: string }> = {
  PENDENTE: { label: "PENDENTE", dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100" },
  EM_ANDAMENTO: { label: "EM ANDAMENTO", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-100" },
  ATRASADA: { label: "ATRASADA", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-100" },
  CONCLUIDA_NO_HORARIO: {
    label: "CONCLUÍDA NO HORÁRIO",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-100",
  },
  CONCLUIDA_COM_ATRASO: {
    label: "CONCLUÍDA COM ATRASO",
    dot: "bg-orange-500",
    text: "text-orange-700",
    bg: "bg-orange-100",
  },
};

export function StatusBadge({ status, size = "md" }: { status: DisplayStatus; size?: "sm" | "md" }) {
  const config = STATUS_CONFIG[status];
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${config.bg} ${config.text} ${padding}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
