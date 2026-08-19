"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TURNOS } from "@/lib/shifts";
import type { Caregiver, Turno } from "@/lib/types";

export function ShiftSetup({
  onConfirm,
}: {
  onConfirm: (caregiverId: string, turno: Turno) => void;
}) {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [caregiverId, setCaregiverId] = useState<string | null>(null);
  const [turno, setTurno] = useState<Turno | null>(null);

  useEffect(() => {
    supabase
      .from("caregivers")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data }) => setCaregivers(data ?? []));
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-10">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-900">Início de plantão</h1>
        <p className="mt-1 text-slate-500">Selecione seu nome e o turno atual</p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Cuidador</h2>
        <div className="flex flex-col gap-3">
          {caregivers.map((c) => (
            <button
              key={c.id}
              onClick={() => setCaregiverId(c.id)}
              className={`rounded-xl border-2 p-4 text-left text-lg font-medium transition ${
                caregiverId === c.id
                  ? "border-teal-600 bg-teal-50 text-teal-800"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Turno</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTurno("diurno")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
              turno === "diurno"
                ? "border-teal-600 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <Sun size={24} />
            <span className="font-semibold">Diurno</span>
            <span className="text-xs text-slate-500">{TURNOS.diurno.start} - {TURNOS.diurno.end}</span>
          </button>
          <button
            onClick={() => setTurno("noturno")}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
              turno === "noturno"
                ? "border-teal-600 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <Moon size={24} />
            <span className="font-semibold">Noturno</span>
            <span className="text-xs text-slate-500">{TURNOS.noturno.start} - {TURNOS.noturno.end}</span>
          </button>
        </div>
      </div>

      <button
        disabled={!caregiverId || !turno}
        onClick={() => caregiverId && turno && onConfirm(caregiverId, turno)}
        className="rounded-xl bg-teal-600 py-4 text-lg font-bold text-white shadow-sm disabled:bg-slate-300"
      >
        ENTRAR NO PLANTÃO
      </button>
    </div>
  );
}
