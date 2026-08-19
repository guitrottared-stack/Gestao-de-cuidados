import type { DisplayStatus } from "@/lib/types";

export function IndicatorsRow({ counts }: { counts: Record<DisplayStatus, number> }) {
  const items: { status: DisplayStatus; label: string; dot: string }[] = [
    { status: "CONCLUIDA", label: "concluídas", dot: "bg-emerald-500" },
    { status: "EM_ANDAMENTO", label: "em andamento", dot: "bg-amber-500" },
    { status: "ATRASADA", label: "atrasadas", dot: "bg-red-500" },
    { status: "PENDENTE", label: "pendentes", dot: "bg-slate-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.status} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} />
          <span className="text-lg font-bold text-slate-900">{counts[item.status]}</span>
          <span className="text-sm text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
