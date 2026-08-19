"use client";

import { useEffect, useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { usePaciente } from "@/lib/usePaciente";
import { useTodayTasks } from "@/lib/useTodayTasks";
import { detectBatchAlerts } from "@/lib/status";
import { PLANTAO } from "@/lib/constants";
import { LoginForm } from "@/components/auth/LoginForm";
import { OverallStatusBanner } from "@/components/monitoramento/OverallStatusBanner";
import { IndicatorsRow } from "@/components/monitoramento/IndicatorsRow";
import { TaskRow } from "@/components/monitoramento/TaskRow";
import { BatchAlertBanner } from "@/components/monitoramento/BatchAlertBanner";
import type { DisplayStatus } from "@/lib/types";

export default function MonitoramentoPage() {
  const { user, usuario, loading: authLoading, signIn, signOut } = useAuth();
  const { paciente, loading: pacienteLoading, error: pacienteError } = usePaciente(!!user);
  const { tarefas, execucoes, loading, error, now } = useTodayTasks(paciente?.id ?? null);
  const [cuidadorAtualNome, setCuidadorAtualNome] = useState<string | null>(null);

  const execucaoMaisRecente = useMemo(
    () => [...execucoes].sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())[0] ?? null,
    [execucoes]
  );

  useEffect(() => {
    if (!execucaoMaisRecente) return;
    let cancelled = false;
    supabase
      .from("usuario")
      .select("nome")
      .eq("id", execucaoMaisRecente.cuidador_id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setCuidadorAtualNome(data?.nome ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [execucaoMaisRecente]);

  const counts = useMemo(() => {
    const base: Record<DisplayStatus, number> = {
      PENDENTE: 0,
      EM_ANDAMENTO: 0,
      ATRASADA: 0,
      CONCLUIDA_NO_HORARIO: 0,
      CONCLUIDA_COM_ATRASO: 0,
    };
    for (const tarefa of tarefas) base[tarefa.status]++;
    return base;
  }, [tarefas]);

  const batchAlerts = useMemo(() => {
    const horarioPorTarefa = new Map(tarefas.map((t) => [t.id, t.horario_previsto]));
    const comHorario = execucoes
      .filter((e) => horarioPorTarefa.has(e.tarefa_id))
      .map((e) => ({ inicio: e.inicio, fim: e.fim, horario_previsto: horarioPorTarefa.get(e.tarefa_id)! }));
    return detectBatchAlerts(comHorario);
  }, [execucoes, tarefas]);

  if (authLoading || pacienteLoading) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-400">Carregando...</div>;
  }

  if (!user) {
    return <LoginForm title="Entrar" subtitle="Acompanhe o plantão em tempo real" onSubmit={signIn} />;
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
      <header className="mb-4 rounded-2xl bg-slate-800 p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Monitoramento do plantão</p>
            <p className="mt-1 text-lg font-bold">{paciente.nome}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1 rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-200"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
        <div className="mt-2 space-y-0.5 text-sm text-slate-300">
          <p>Cuidador: {cuidadorAtualNome ?? "Nenhum registro ainda hoje"}</p>
          <p>
            Plantão: {PLANTAO.start} - {PLANTAO.end}
          </p>
        </div>
      </header>

      {loading && <p className="text-center text-slate-400">Carregando rotina...</p>}
      {error && <p className="text-center text-red-600">Erro ao carregar dados: {error}</p>}

      {!loading && !error && (
        <div className="space-y-5">
          <OverallStatusBanner haTarefaAtrasada={counts.ATRASADA > 0} />
          <IndicatorsRow counts={counts} />

          {batchAlerts.map((alert, i) => (
            <BatchAlertBanner key={i} alert={alert} />
          ))}

          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Tarefas do dia</h2>
            <ul className="space-y-2">
              {tarefas.map((tarefa) => (
                <TaskRow key={tarefa.id} tarefa={tarefa} now={now} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
