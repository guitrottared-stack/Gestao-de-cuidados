import { supabase } from "./supabase";
import { todayDateString } from "./status";
import type { Shift, Turno } from "./types";

export const TURNOS: Record<Turno, { label: string; start: string; end: string }> = {
  diurno: { label: "Diurno", start: "06:00", end: "18:00" },
  noturno: { label: "Noturno", start: "18:00", end: "06:00" },
};

/** Busca o plantão de hoje para o cuidador+turno informados, criando um novo se não existir. */
export async function getOrCreateShift(
  patientId: string,
  caregiverId: string,
  turno: Turno
): Promise<Shift> {
  const date = todayDateString();
  const { start, end } = TURNOS[turno];

  const { data: existing, error: selectError } = await supabase
    .from("shifts")
    .select("*")
    .eq("patient_id", patientId)
    .eq("caregiver_id", caregiverId)
    .eq("date", date)
    .eq("start_time", start)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as Shift;

  const { data: created, error: insertError } = await supabase
    .from("shifts")
    .insert({
      patient_id: patientId,
      caregiver_id: caregiverId,
      date,
      start_time: start,
      end_time: end,
    })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return created as Shift;
}
