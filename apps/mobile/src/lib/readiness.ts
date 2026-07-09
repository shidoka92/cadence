// Signal — readiness (forme du jour). Calcul pur + accès Supabase.
// Le score pondère sommeil, énergie, courbatures (inversées) et humeur.
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReadinessInputs {
  sleepHours: number | null; // ex. 7.5
  sleepQuality: number; // 1-5
  energy: number; // 1-5
  soreness: number; // 1-5 (5 = très courbaturé → pénalise)
  mood: number; // 1-5
}

export interface Checkin extends ReadinessInputs {
  date: string; // YYYY-MM-DD
  score: number; // 0-100
}

// normalise une échelle 1-5 vers 0..1
const n5 = (v: number): number => Math.min(1, Math.max(0, (v - 1) / 4));

// heures de sommeil → 0..1 : plateau optimal 7-9 h, pénalise le manque et l'excès
function sleepScore(h: number | null): number {
  if (h == null) return 0.6; // neutre si non renseigné
  if (h >= 7 && h <= 9) return 1;
  if (h < 7) return Math.max(0, h / 7); // 0 h → 0, 7 h → 1
  return Math.max(0, 1 - (h - 9) / 4); // 9 h → 1, 13 h → 0
}

const WEIGHTS = { sleepHours: 0.25, sleepQuality: 0.2, energy: 0.25, soreness: 0.2, mood: 0.1 };

/** Readiness 0-100 à partir des ressentis du jour. Pur, testable. */
export function computeReadiness(i: ReadinessInputs): number {
  const total =
    sleepScore(i.sleepHours) * WEIGHTS.sleepHours +
    n5(i.sleepQuality) * WEIGHTS.sleepQuality +
    n5(i.energy) * WEIGHTS.energy +
    (1 - n5(i.soreness)) * WEIGHTS.soreness + // courbatures inversées
    n5(i.mood) * WEIGHTS.mood;
  return Math.round(total * 100);
}

export interface ReadinessVerdict {
  label: string;
  advice: string;
  tone: "ok" | "warn" | "risk";
}

/** Interprétation du score pour l'élève (feu vert / prudence / récup). */
export function readinessVerdict(score: number): ReadinessVerdict {
  if (score >= 75) return { label: "Feu vert", advice: "Bonne forme, tu peux pousser aujourd'hui.", tone: "ok" };
  if (score >= 50) return { label: "Correct", advice: "Séance normale, reste à l'écoute de ton corps.", tone: "warn" };
  return { label: "Fatigue", advice: "Récup ou charge allégée conseillée aujourd'hui.", tone: "risk" };
}

/** Date locale YYYY-MM-DD (évite le décalage UTC de toISOString près de minuit). */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Row = {
  date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  energy: number | null;
  soreness: number | null;
  mood: number | null;
  score: number;
};

const toCheckin = (r: Row): Checkin => ({
  date: r.date,
  sleepHours: r.sleep_hours,
  sleepQuality: r.sleep_quality ?? 3,
  energy: r.energy ?? 3,
  soreness: r.soreness ?? 3,
  mood: r.mood ?? 3,
  score: r.score,
});

/** Check-in du jour, ou null si absent / table non déployée (migration 0011). */
export async function getTodayCheckin(supabase: SupabaseClient, studentId: string): Promise<Checkin | null> {
  const { data, error } = await supabase
    .from("readiness_checkins")
    .select("date, sleep_hours, sleep_quality, energy, soreness, mood, score")
    .eq("student_id", studentId)
    .eq("date", todayKey())
    .maybeSingle();
  if (error || !data) return null;
  return toCheckin(data as Row);
}

/** N derniers check-ins (récent → ancien). [] si table absente. */
export async function getRecentCheckins(supabase: SupabaseClient, studentId: string, limit = 7): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from("readiness_checkins")
    .select("date, sleep_hours, sleep_quality, energy, soreness, mood, score")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Row[]).map(toCheckin);
}

/** Enregistre (upsert) le check-in du jour. Renvoie une erreur lisible ou null. */
export async function saveCheckin(supabase: SupabaseClient, studentId: string, inputs: ReadinessInputs): Promise<string | null> {
  const score = computeReadiness(inputs);
  const { error } = await supabase.from("readiness_checkins").upsert(
    {
      student_id: studentId,
      date: todayKey(),
      sleep_hours: inputs.sleepHours,
      sleep_quality: inputs.sleepQuality,
      energy: inputs.energy,
      soreness: inputs.soreness,
      mood: inputs.mood,
      score,
      source: "manual",
    },
    { onConflict: "student_id,date" }
  );
  if (error) {
    if (error.code === "42P01") return "La fonctionnalité Signal n'est pas encore activée (migration à appliquer).";
    return "Enregistrement impossible. Réessaie.";
  }
  return null;
}
