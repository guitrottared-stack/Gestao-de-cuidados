"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Paciente } from "./types";

export function usePaciente(ready: boolean) {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) {
      setPaciente(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase
      .from("paciente")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        setPaciente(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return { paciente, loading, error };
}
