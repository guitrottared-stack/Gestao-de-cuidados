"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePatient } from "@/lib/usePatient";
import { useTodayTasks } from "@/lib/useTodayTasks";
import { OverallStatusBanner, type OverallLevel } from "@/components/monitoramento/OverallStatusBanner";
import { IndicatorsRow } from "@/components/monitoramento/IndicatorsRow";
import { TaskRow } from "@/components/monitoramento/TaskRow";
import type { DisplayStatus } from "@/lib/types";

export default function MonitoramentoPage() {
  const { patient, loading: patientLoading, error: patientError } = usePatient();
  const { tasks, shiftsToday, loading, error, now } = useTodayTasks(patient?.id ?? null);
  const [caregiverName, setCaregiverName] = useState<string | null>(null);

  const latestShift = useMemo(
    () => [...shiftsToday].sort((a, b) => b.start_time.localeCompare(a.start_time))[0] ?? null,
    [shiftsToday]
  );

  useEffect(() => {
    if (!latestShift) return;
    let cancelled = false;
    supabase
      .from("caregivers")
      .select("name")
      .eq("id", latestShift.caregiver_id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setCaregiverName(data?.name ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [latestShift]);

  const displayedCaregiverName = latestShift ? caregiverName : null;

  const counts = useMemo(() => {
    const base: Record<DisplayStatus, number> = { PENDENTE: 0, EM_ANDAMENTO: 0, CONCLUIDA: 0, ATRASADA: 0 };
    for (const task of tasks) base[task.status]++;
    return base;
  }, [tasks]);

  const overallLevel: OverallLevel = useMemo(() => {
    if (counts.ATRASADA >= 3) return "critico";
    if (counts.ATRASADA >= 1) return "atencao";
    return "ok";
  }, [counts]);

  if (patientLoading) {
    return <div className="flex min-h-dvh items-center justify-center text-slate-400">Carregando...</div>;
  }

  if (patientError || !patient) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-semibold text-red-600">Não foi possível carregar o paciente.</p>
        <p className="text-sm text-slate-500">
          {patientError ?? "Verifique se o Supabase está configurado e se supabase/seed.sql foi executado."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-12">
      <header className="mb-4 rounded-2xl bg-slate-800 p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Monitoramento do plantão</p>
        <p className="mt-1 text-lg font-bold">{patient.name}</p>
        <div className="mt-2 space-y-0.5 text-sm text-slate-300">
          <p>Cuidador: {displayedCaregiverName ?? "Aguardando início do plantão"}</p>
          {latestShift && (
            <p>
              Plantão: {latestShift.start_time.slice(0, 5)} - {latestShift.end_time.slice(0, 5)}
            </p>
          )}
        </div>
      </header>

      {loading && <p className="text-center text-slate-400">Carregando rotina...</p>}
      {error && <p className="text-center text-red-600">Erro ao carregar dados: {error}</p>}

      {!loading && !error && (
        <div className="space-y-5">
          <OverallStatusBanner level={overallLevel} />
          <IndicatorsRow counts={counts} />

          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Tarefas do dia</h2>
            <ul className="space-y-2">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} now={now} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
