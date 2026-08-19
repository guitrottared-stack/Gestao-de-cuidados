"use client";

import { useCallback, useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { usePaciente } from "@/lib/usePaciente";
import { useTodayTasks } from "@/lib/useTodayTasks";
import { calcAtrasoMinutos } from "@/lib/status";
import { PLANTAO } from "@/lib/constants";
import { LoginForm } from "@/components/auth/LoginForm";
import { CurrentTaskCard } from "@/components/cuidador/CurrentTaskCard";
import { UpcomingTaskList } from "@/components/cuidador/UpcomingTaskList";

const CONCLUDED_STATUSES = new Set(["CONCLUIDA_NO_HORARIO", "CONCLUIDA_COM_ATRASO"]);

export default function CuidadorPage() {
  const { user, usuario, loading: authLoading, signIn, signOut } = useAuth();
  const { paciente, loading: pacienteLoading, error: pacienteError } = usePaciente(!!user);
  const { tarefas, loading, error, now, refetch } = useTodayTasks(paciente?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentTarefa = useMemo(() => tarefas.find((t) => !CONCLUDED_STATUSES.has(t.status)) ?? null, [tarefas]);
  const upcomingTarefas = useMemo(() => {
    if (!currentTarefa) return [];
    const idx = tarefas.findIndex((t) => t.id === currentTarefa.id);
    return tarefas.slice(idx + 1, idx + 6);
  }, [tarefas, currentTarefa]);

  const handleStart = useCallback(async () => {
    if (!currentTarefa || !user) return;
    setBusy(true);
    setActionError(null);
    const inicio = new Date();
    const { error } = await supabase.from("execucao").insert({
      tarefa_id: currentTarefa.id,
      cuidador_id: user.id,
      status: "EM_ANDAMENTO",
      atraso_minutos: calcAtrasoMinutos(currentTarefa.horario_previsto, inicio),
    });
    setBusy(false);
    if (error) {
      setActionError("Não foi possível iniciar a tarefa. Tente novamente.");
      return;
    }
    refetch();
  }, [currentTarefa, user, refetch]);

  const handleFinish = useCallback(async () => {
    if (!currentTarefa?.execucao) return;
    setBusy(true);
    setActionError(null);
    const { error } = await supabase
      .from("execucao")
      .update({ fim: new Date().toISOString(), status: "CONCLUIDA" })
      .eq("id", currentTarefa.execucao.id);
    setBusy(false);
    if (error) {
      setActionError("Não foi possível finalizar a tarefa. Tente novamente.");
      return;
    }
    refetch();
  }, [currentTarefa, refetch]);

  if (authLoading || pacienteLoading) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-400">Carregando...</div>;
  }

  if (!user) {
    return <LoginForm title="Entrar como Cuidador" subtitle="Acesse com seu e-mail e senha" onSubmit={signIn} />;
  }

  if (!usuario) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-semibold text-red-600">Sua conta ainda não está vinculada a um perfil.</p>
        <p className="text-sm text-slate-500">Peça para o administrador cadastrar seu perfil na tabela `usuario` (veja o README).</p>
        <button onClick={signOut} className="mt-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
          Sair
        </button>
      </div>
    );
  }

  if (usuario.tipo !== "cuidador") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-semibold text-red-600">Esta área é exclusiva para cuidadores.</p>
        <button onClick={signOut} className="mt-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
          Sair
        </button>
      </div>
    );
  }

  if (pacienteError || !paciente) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-semibold text-red-600">Não foi possível carregar o paciente.</p>
        <p className="text-sm text-slate-500">
          {pacienteError ?? "Verifique se o Supabase está configurado e se supabase/seed.sql foi executado."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-12">
      <header className="mb-6 rounded-2xl bg-teal-700 p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-200">Plantão</p>
            <p className="mt-1 text-lg font-bold">{paciente.nome}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1 rounded-lg bg-teal-800/60 px-2.5 py-1.5 text-xs font-medium text-teal-100"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
        <div className="mt-3 space-y-0.5 text-sm text-teal-100">
          <p>Cuidador: {usuario.nome}</p>
          <p>
            Horário do plantão: {PLANTAO.start} - {PLANTAO.end}
          </p>
        </div>
      </header>

      {loading && <p className="text-center text-slate-400">Carregando rotina...</p>}
      {error && <p className="text-center text-red-600">Erro ao carregar dados: {error}</p>}
      {actionError && <p className="mb-4 text-center text-sm font-medium text-red-600">{actionError}</p>}

      {!loading && !error && (
        <div className="space-y-8">
          {currentTarefa ? (
            <CurrentTaskCard
              tarefa={currentTarefa}
              onStart={handleStart}
              onFinish={handleFinish}
              busy={busy}
              now={now}
            />
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <p className="text-lg font-bold text-emerald-800">Todas as tarefas de hoje foram concluídas 🎉</p>
            </div>
          )}

          <UpcomingTaskList tarefas={upcomingTarefas} />
        </div>
      )}
    </div>
  );
}
