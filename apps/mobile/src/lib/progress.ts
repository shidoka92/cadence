// Progrès élève — dérive les stats Momentum du journal.
// Miroir allégé de apps/web/lib/queries.ts:getStudentProgress (sans les courbes,
// pas de lib de graphes sur mobile pour l'instant). Mêmes formules pour rester
// cohérent avec la page web.
import type { SupabaseClient } from "@supabase/supabase-js";

const WEEK_MS = 7 * 864e5;
const RECENT_PR_MS = 14 * 864e5;

export interface PersonalRecord {
  name: string;
  load: number;
  date: string;
}

export interface StudentProgress {
  hasEntries: boolean;
  streak: number;
  totalSessions: number;
  totalVolume: number;
  prs: PersonalRecord[];
  recentPr: PersonalRecord | null;
}

type Entry = {
  exercise: string;
  exercise_id: string | null;
  load: number | null;
  reps: number | null;
  session_ref: string | null;
  created_at: string;
};

const frDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

export async function getStudentProgress(
  supabase: SupabaseClient,
  studentId: string
): Promise<StudentProgress> {
  const { data } = await supabase
    .from("journal_entries")
    .select("exercise, exercise_id, load, reps, session_ref, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true })
    .limit(500);
  const entries = (data ?? []) as Entry[];

  // régularité : semaines consécutives avec au moins une entrée, depuis aujourd'hui
  const activeWeeks = new Set(entries.map((e) => Math.floor((Date.now() - new Date(e.created_at).getTime()) / WEEK_MS)));
  let streak = 0;
  while (activeWeeks.has(streak)) streak++;

  const totalSessions = new Set(entries.map((e) => e.session_ref).filter(Boolean)).size;
  const totalVolume = entries.reduce((sum, e) => sum + (e.load != null && e.reps != null ? Number(e.load) * Number(e.reps) : 0), 0);

  // groupement par exercice — id du plan si présent (mode séance), sinon nom normalisé
  const groups = new Map<string, { name: string; points: { load: number; date: string }[] }>();
  for (const e of entries) {
    if (e.load == null) continue;
    const key = e.exercise_id ?? e.exercise.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, { name: e.exercise, points: [] });
    const g = groups.get(key)!;
    g.name = e.exercise;
    g.points.push({ load: Number(e.load), date: e.created_at });
  }

  const prs = [...groups.values()]
    .map((g) => {
      const best = g.points.reduce((a, b) => (b.load >= a.load ? b : a));
      return { name: g.name, load: best.load, date: frDate(best.date) };
    })
    .sort((a, b) => b.load - a.load);

  // record récent : pic battu dans les 14 derniers jours
  let recentPr: PersonalRecord | null = null;
  let recentPrTime = 0;
  for (const g of groups.values()) {
    if (g.points.length < 2) continue;
    const sorted = [...g.points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const last = sorted[sorted.length - 1];
    const prevBest = Math.max(...sorted.slice(0, -1).map((p) => p.load));
    const t = new Date(last.date).getTime();
    if (last.load > prevBest && Date.now() - t <= RECENT_PR_MS && t > recentPrTime) {
      recentPrTime = t;
      recentPr = { name: g.name, load: last.load, date: frDate(last.date) };
    }
  }

  return { hasEntries: entries.length > 0, streak, totalSessions, totalVolume, prs, recentPr };
}

export interface LeaderboardRow {
  studentId: string;
  name: string;
  sessions: number;
  position: number;
  isMe: boolean;
}

/**
 * Classement des élèves d'une même classe (séances sur 30 j).
 * [] si la RPC class_leaderboard n'est pas déployée ou si l'élève est hors classe.
 */
export async function getClassLeaderboard(supabase: SupabaseClient): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("class_leaderboard");
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    studentId: r.student_id,
    name: r.display_name,
    sessions: r.sessions,
    position: r.place,
    isMe: r.is_me,
  }));
}
