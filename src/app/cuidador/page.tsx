"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePatient } from "@/lib/usePatient";
import { useTodayTasks } from "@/lib/useTodayTasks";
import { scheduledDateTimeToday } from "@/lib/status";
import { getOrCreateShift, TURNOS } from "@/lib/shifts";
import { ShiftSetup } from "@/components/cuidador/ShiftSetup";
import { CurrentTaskCard } from "@/components/cuidador/CurrentTaskCard";
import { UpcomingTaskList } from "@/components/cuidador/UpcomingTaskList";
import type { Caregiver, Turno } from "@/lib/types";

const STORAGE_KEY = "cuidador-sessao";

interface Session {
  caregiverId: string;
  caregiverName: string;
  turno: Turno;
}

export default function CuidadorPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { patient, loading: patientLoading, error: patientError } = usePatient();
  const { tasks, loading, error, now, refetch } = useTodayTasks(patient?.id ?? null);

  useEffect(() => {
    queueMicrotask(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setSession(raw ? (JSON.parse(raw) as Session) : null);
    });
  }, []);

  useEffect(() => {
    if (!session || !patient) return;
    let cancelled = false;
    getOrCreateShift(patient.id, session.caregiverId, session.turno).then((shift) => {
      if (!cancelled) setShiftId(shift.id);
    });
    return () => {
      cancelled = true;
    };
  }, [session, patient]);

  const confirmSetup = useCallback(async (caregiverId: string, turno: Turno) => {
    const { data } = await supabase.from("caregivers").select("*").eq("id", caregiverId).single<Caregiver>();
    const newSession: Session = { caregiverId, caregiverName: data?.name ?? "Cuidador", turno };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
  }, []);

  const trocarPlantao = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setShiftId(null);
  }, []);

  const currentTask = useMemo(() => tasks.find((t) => t.status !== "CONCLUIDA") ?? null, [tasks]);
  const upcomingTasks = useMemo(() => {
    if (!currentTask) return [];
    const idx = tasks.findIndex((t) => t.id === currentTask.id);
    return tasks.slice(idx + 1, idx + 6);
  }, [tasks, currentTask]);

  const handleStart = useCallback(async () => {
    if (!currentTask || !shiftId) return;
    setBusy(true);
    setActionError(null);
    const { error } = await supabase.from("task_executions").insert({
      task_id: currentTask.id,
      shift_id: shiftId,
      status: "EM_ANDAMENTO",
    });
    setBusy(false);
    if (error) {
      setActionError("Não foi possível iniciar a tarefa. Tente novamente.");
      return;
    }
    refetch();
  }, [currentTask, shiftId, refetch]);

  const handleFinish = useCallback(async () => {
    if (!currentTask?.execution) return;
    setBusy(true);
    setActionError(null);
    const startedAt = new Date(currentTask.execution.started_at);
    const scheduled = scheduledDateTimeToday(currentTask.scheduled_time, startedAt);
    const isDelayed = startedAt.getTime() > scheduled.getTime();

    const { error } = await supabase
      .from("task_executions")
      .update({ completed_at: new Date().toISOString(), status: "CONCLUIDA", is_delayed: isDelayed })
      .eq("id", currentTask.execution.id);
    setBusy(false);
    if (error) {
      setActionError("Não foi possível finalizar a tarefa. Tente novamente.");
      return;
    }
    refetch();
  }, [currentTask, refetch]);

  if (session === undefined || patientLoading) {
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

  if (!session) {
    return <ShiftSetup onConfirm={confirmSetup} />;
  }

  const turnoInfo = TURNOS[session.turno];

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-12">
      <header className="mb-6 rounded-2xl bg-teal-700 p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-200">Plantão</p>
            <p className="mt-1 text-lg font-bold">{patient.name}</p>
          </div>
          <button
            onClick={trocarPlantao}
            className="flex items-center gap-1 rounded-lg bg-teal-800/60 px-2.5 py-1.5 text-xs font-medium text-teal-100"
          >
            <LogOut size={14} />
            Trocar
          </button>
        </div>
        <div className="mt-3 space-y-0.5 text-sm text-teal-100">
          <p>Cuidador: {session.caregiverName}</p>
          <p>
            Horário do plantão: {turnoInfo.start} - {turnoInfo.end}
          </p>
        </div>
      </header>

      {loading && <p className="text-center text-slate-400">Carregando rotina...</p>}
      {error && <p className="text-center text-red-600">Erro ao carregar dados: {error}</p>}
      {actionError && <p className="mb-4 text-center text-sm font-medium text-red-600">{actionError}</p>}

      {!loading && !error && (
        <div className="space-y-8">
          {currentTask ? (
            <CurrentTaskCard task={currentTask} onStart={handleStart} onFinish={handleFinish} busy={busy} now={now} />
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <p className="text-lg font-bold text-emerald-800">Todas as tarefas de hoje foram concluídas 🎉</p>
            </div>
          )}

          <UpcomingTaskList tasks={upcomingTasks} />
        </div>
      )}
    </div>
  );
}
