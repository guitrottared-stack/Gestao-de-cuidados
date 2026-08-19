"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { attachStatus, todayRangeISO } from "./status";
import type { Execucao, Tarefa, TarefaComStatus } from "./types";

interface UseTodayTasksResult {
  tarefas: TarefaComStatus[];
  execucoes: Execucao[];
  loading: boolean;
  error: string | null;
  now: Date;
  refetch: () => void;
}

/**
 * Carrega a rotina do paciente e as execuções de hoje, mantendo tudo em
 * sincronia via Supabase Realtime (execucao) e um relógio interno (para
 * tarefas passarem de PENDENTE para ATRASADA mesmo sem eventos novos).
 */
export function useTodayTasks(pacienteId: string | null): UseTodayTasksResult {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [execucoes, setExecucoes] = useState<Execucao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!pacienteId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { startISO, endISO } = todayRangeISO();

      const [tarefasRes, execucoesRes] = await Promise.all([
        supabase
          .from("tarefa")
          .select("*")
          .eq("paciente_id", pacienteId)
          .eq("ativo", true)
          .order("horario_previsto", { ascending: true })
          .order("ordem", { ascending: true }),
        supabase.from("execucao").select("*").gte("inicio", startISO).lt("inicio", endISO),
      ]);

      if (cancelled) return;

      if (tarefasRes.error) {
        setError(tarefasRes.error.message);
        setLoading(false);
        return;
      }
      if (execucoesRes.error) {
        setError(execucoesRes.error.message);
        setLoading(false);
        return;
      }

      setTarefas(tarefasRes.data ?? []);
      setExecucoes(execucoesRes.data ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [pacienteId, reloadToken]);

  useEffect(() => {
    if (!pacienteId) return;

    const channel = supabase
      .channel(`execucao-${pacienteId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "execucao" }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pacienteId, refetch]);

  return {
    tarefas: attachStatus(tarefas, execucoes, now),
    execucoes,
    loading,
    error,
    now,
    refetch,
  };
}
