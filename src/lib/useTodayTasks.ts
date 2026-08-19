"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { attachStatus, todayDateString } from "./status";
import type { Shift, Task, TaskExecution, TaskWithStatus } from "./types";

interface UseTodayTasksResult {
  tasks: TaskWithStatus[];
  shiftsToday: Shift[];
  loading: boolean;
  error: string | null;
  now: Date;
  refetch: () => void;
}

/**
 * Carrega a rotina do paciente e as execuções de hoje, mantendo tudo em
 * sincronia via Supabase Realtime (task_executions) e um relógio interno
 * (para tarefas passarem de PENDENTE para ATRASADA mesmo sem eventos novos).
 */
export function useTodayTasks(patientId: string | null): UseTodayTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [shiftsToday, setShiftsToday] = useState<Shift[]>([]);
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
    if (!patientId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const date = todayDateString();

      const [tasksRes, shiftsRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*")
          .eq("patient_id", patientId)
          .eq("active", true)
          .order("scheduled_time", { ascending: true })
          .order("sort_order", { ascending: true }),
        supabase.from("shifts").select("*").eq("patient_id", patientId).eq("date", date),
      ]);

      if (cancelled) return;

      if (tasksRes.error) {
        setError(tasksRes.error.message);
        setLoading(false);
        return;
      }
      if (shiftsRes.error) {
        setError(shiftsRes.error.message);
        setLoading(false);
        return;
      }

      const shiftIds = (shiftsRes.data ?? []).map((s) => s.id);
      let executionsData: TaskExecution[] = [];
      if (shiftIds.length > 0) {
        const executionsRes = await supabase
          .from("task_executions")
          .select("*")
          .in("shift_id", shiftIds);
        if (cancelled) return;
        if (executionsRes.error) {
          setError(executionsRes.error.message);
          setLoading(false);
          return;
        }
        executionsData = executionsRes.data ?? [];
      }

      setTasks(tasksRes.data ?? []);
      setShiftsToday(shiftsRes.data ?? []);
      setExecutions(executionsData);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [patientId, reloadToken]);

  useEffect(() => {
    if (!patientId) return;

    const channel = supabase
      .channel(`task_executions-${patientId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_executions" }, () => {
        refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, refetch]);

  return {
    tasks: attachStatus(tasks, executions, now),
    shiftsToday,
    loading,
    error,
    now,
    refetch,
  };
}
