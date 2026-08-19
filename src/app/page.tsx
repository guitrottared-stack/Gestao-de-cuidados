import Link from "next/link";
import { HeartPulse, ClipboardList, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="rounded-2xl bg-teal-600 p-3 text-white">
          <HeartPulse size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Rotina de Cuidados</h1>
        <p className="text-slate-500">Escolha como deseja acessar</p>
      </div>

      <Link
        href="/cuidador"
        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm active:scale-[0.98]"
      >
        <span className="rounded-xl bg-teal-100 p-3 text-teal-700">
          <ClipboardList size={28} />
        </span>
        <span>
          <span className="block text-lg font-semibold text-slate-900">Sou Cuidador</span>
          <span className="block text-sm text-slate-500">Iniciar e finalizar tarefas do plantão</span>
        </span>
      </Link>

      <Link
        href="/monitoramento"
        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm active:scale-[0.98]"
      >
        <span className="rounded-xl bg-teal-100 p-3 text-teal-700">
          <Users size={28} />
        </span>
        <span>
          <span className="block text-lg font-semibold text-slate-900">Sou Família</span>
          <span className="block text-sm text-slate-500">Acompanhar a rotina em tempo real</span>
        </span>
      </Link>
    </div>
  );
}
