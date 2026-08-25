"use client";

import { LogOut, AlertTriangle, UserX } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useGestorOverview } from "@/lib/useGestorOverview";
import { LoginForm } from "@/components/auth/LoginForm";

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function GestorPage() {
  const { user, usuario, loading: authLoading, signIn, signOut } = useAuth();
  const isGestor = usuario?.tipo === "gestor";
  const { pacientes, totais, loading, error } = useGestorOverview(isGestor);

  if (authLoading) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-400">Carregando...</div>;
  }

  if (!user) {
    return <LoginForm title="Painel do gestor" subtitle="Acompanhe todos os plantões" onSubmit={signIn} />;
  }

  if (!usuario || !isGestor) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-semibold text-red-600">Esta conta não tem acesso ao painel do gestor.</p>
        <button onClick={signOut} className="mt-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-12">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Painel do gestor</p>
          <p className="text-lg font-bold text-slate-800">{totais.totalPacientes} pacientes</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700"
        >
          <LogOut size={14} />
          Sair
        </button>
      </header>

      {loading && <p className="text-center text-slate-400">Carregando painel...</p>}
      {error && <p className="text-center text-red-600">Erro ao carregar dados: {error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {totais.tarefasAtrasadas > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {totais.tarefasAtrasadas} {totais.tarefasAtrasadas === 1 ? "tarefa atrasada" : "tarefas atrasadas"}
                </p>
                <p className="text-xs text-red-600">
                  {pacientes
                    .filter((p) => p.temTarefaAtrasada)
                    .map((p) => p.paciente_nome)
                    .join(" · ")}
                </p>
              </div>
            </div>
          )}

          {totais.naoIniciados > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3">
              <UserX size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-700">
                  {totais.naoIniciados} {totais.naoIniciados === 1 ? "plantão não iniciado" : "plantões não iniciados"}
                </p>
                <p className="text-xs text-amber-600">
                  {pacientes
                    .filter((p) => p.plantaoStatus === "NAO_INICIADO")
                    .map((p) => `${p.paciente_nome} (${p.minutosAtrasoInicio}min)`)
                    .join(" · ")}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-xs text-slate-500">Plantões ativos</p>
              <p className="text-2xl font-bold text-slate-800">
                {totais.plantoesAtivos} <span className="text-sm font-normal text-slate-400">/ {totais.totalPacientes}</span>
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-xs text-slate-500">No horário hoje</p>
              <p className="text-2xl font-bold text-emerald-600">{totais.pctNoHorario ?? "—"}{totais.pctNoHorario !== null && "%"}</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-xs text-slate-500">Em andamento</p>
              <p className="text-2xl font-bold text-slate-800">{totais.tarefasEmAndamento}</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-xs text-slate-500">Alertas de lote (hoje)</p>
              <p className="text-2xl font-bold text-amber-600">{totais.alertasLote}</p>
            </div>
          </div>

          <div>
            <h2 className="mb-2 mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">Plantões</h2>
            <ul className="space-y-1.5">
              {pacientes.map((p) => (
                <li
                  key={p.paciente_id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.paciente_nome}</p>
                    <p className="text-xs text-slate-500">
                      {p.plantaoStatus === "ATIVO"
                        ? `${p.cuidadorNome ?? "cuidador"} · desde ${p.plantaoInicio ? formatHora(p.plantaoInicio) : "-"}`
                        : "sem cuidador logado"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                      p.plantaoStatus === "NAO_INICIADO"
                        ? "bg-amber-50 text-amber-700"
                        : p.temTarefaAtrasada
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {p.plantaoStatus === "NAO_INICIADO" ? "não iniciado" : p.temTarefaAtrasada ? "atrasado" : "em dia"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
