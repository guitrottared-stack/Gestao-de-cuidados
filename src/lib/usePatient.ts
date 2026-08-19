"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Patient } from "./types";

export function usePatient() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("patients")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        setPatient(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { patient, loading, error };
}
