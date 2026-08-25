"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { attachStatus, todayRangeISO, detectBatchAlerts, minutesLate } from "./status";
import { PLANTAO } from "./constants";
import type { Execucao, Tarefa, DisplayStatus } from "./types";

export type PlantaoStatusResumo = "ATIVO" | "NAO_INICIADO" | "AGUARDANDO";

export interface PacienteResumo {
  paciente_id: string;
  paciente_nome: string;
  plantaoStatus: PlantaoStatusResumo;
  cuidadorNome: string | null;
  plantaoInicio: string | null;
  minutosAtrasoInicio: number;
  counts: Record<DisplayStatus, number>;
  temTarefaAtrasada: boolean;
  alertasLote: number;
}

export interface GestorOverview {
  pacientes: PacienteResumo[];
  totais: {
    totalPacientes: number;
    plantoesAtivos: number;
    naoIniciados: number;
    tarefasAtrasadas: number;
    tarefasEmAndamento: number;
    pctNoHorario: number | null;
    alertasLote: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const EMPTY_COUNTS: Record<DisplayStatus, number> = {
  PENDENTE: 0,
  EM_ANDAMENTO: 0,
  ATRASADA: 0,
  CONCLUIDA_NO_HORARIO: 0,
  CONCLUIDA_COM_ATRASO: 0,
};

/**
 * Visão agregada de todos os pacientes para o papel `gestor`. Depende da
 * RLS: `tem_acesso_paciente()` libera todo paciente para usuário tipo
 * 'gestor', então as mesmas queries usadas na tela de um único paciente
 * aqui retornam a base inteira.
 */
export function useGestorOverview(ready: boolean): GestorOverview {
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { startISO, endISO } = todayRangeISO();
      const now = new Date();

      const [pacientesRes, plantoesRes, tarefasRes, execucoesRes] = await Promise.all([
        supabase.from("paciente").select("id, nome"),
        supabase.from("plantao").select("id, paciente_id, cuidador_id, inicio, usuario:cuidador_id(nome)").is("fim", null),
        supabase.from("tarefa").select("*").eq("ativo", true),
        supabase.from("execucao").select("*").gte("inicio", startISO).lt("inicio", endISO),
      ]);

      if (cancelled) return;

      const firstError = pacientesRes.error || plantoesRes.error || tarefasRes.error || execucoesRes.error;
      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      const todasTarefas = (tarefasRes.data ?? []) as Tarefa[];
      const todasExecucoes = (execucoesRes.data ?? []) as Execucao[];
      const plantoesPorPaciente = new Map(
        (plantoesRes.data ?? []).map((p) => [
          p.paciente_id,
          { cuidadorNome: (p.usuario as unknown as { nome: string } | null)?.nome ?? null, inicio: p.inicio as string },
        ])
      );

      const resumo: PacienteResumo[] = (pacientesRes.data ?? []).map((paciente) => {
        const tarefasDoPaciente = todasTarefas.filter((t) => t.paciente_id === paciente.id);
        const comStatus = attachStatus(tarefasDoPaciente, todasExecucoes, now);
        const counts = { ...EMPTY_COUNTS };
        for (const t of comStatus) counts[t.status]++;

        const plantaoAtivo = plantoesPorPaciente.get(paciente.id) ?? null;
        let plantaoStatus: PlantaoStatusResumo;
        let minutosAtrasoInicio = 0;
        if (plantaoAtivo) {
          plantaoStatus = "ATIVO";
        } else {
          minutosAtrasoInicio = minutesLate(PLANTAO.start, now);
          plantaoStatus = minutosAtrasoInicio > 15 ? "NAO_INICIADO" : "AGUARDANDO";
        }

        const horarioPorTarefa = new Map(tarefasDoPaciente.map((t) => [t.id, t.horario_previsto]));
        const execucoesComHorario = todasExecucoes
          .filter((e) => horarioPorTarefa.has(e.tarefa_id))
          .map((e) => ({ inicio: e.inicio, fim: e.fim, horario_previsto: horarioPorTarefa.get(e.tarefa_id)! }));

        return {
          paciente_id: paciente.id,
          paciente_nome: paciente.nome,
          plantaoStatus,
          cuidadorNome: plantaoAtivo?.cuidadorNome ?? null,
          plantaoInicio: plantaoAtivo?.inicio ?? null,
          minutosAtrasoInicio,
          counts,
          temTarefaAtrasada: counts.ATRASADA > 0,
          alertasLote: detectBatchAlerts(execucoesComHorario).length,
        };
      });

      // Ordena por urgência: não iniciado > tarefa atrasada > resto.
      resumo.sort((a, b) => {
        const rank = (p: PacienteResumo) => (p.plantaoStatus === "NAO_INICIADO" ? 0 : p.temTarefaAtrasada ? 1 : 2);
        return rank(a) - rank(b);
      });

      setPacientes(resumo);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ready, reloadToken]);

  useEffect(() => {
    if (!ready) return;
    const channel = supabase
      .channel("gestor-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "execucao" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "plantao" }, refetch)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ready, refetch]);

  const totais = {
    totalPacientes: pacientes.length,
    plantoesAtivos: pacientes.filter((p) => p.plantaoStatus === "ATIVO").length,
    naoIniciados: pacientes.filter((p) => p.plantaoStatus === "NAO_INICIADO").length,
    tarefasAtrasadas: pacientes.reduce((sum, p) => sum + p.counts.ATRASADA, 0),
    tarefasEmAndamento: pacientes.reduce((sum, p) => sum + p.counts.EM_ANDAMENTO, 0),
    pctNoHorario: (() => {
      const noHorario = pacientes.reduce((sum, p) => sum + p.counts.CONCLUIDA_NO_HORARIO, 0);
      const comAtraso = pacientes.reduce((sum, p) => sum + p.counts.CONCLUIDA_COM_ATRASO, 0);
      const total = noHorario + comAtraso;
      return total === 0 ? null : Math.round((noHorario / total) * 100);
    })(),
    alertasLote: pacientes.reduce((sum, p) => sum + p.alertasLote, 0),
  };

  return { pacientes, totais, loading, error, refetch };
}
