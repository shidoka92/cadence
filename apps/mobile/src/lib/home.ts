// Accueil élève + planning — dérivés de classes / open_sessions.
// Miroir allégé de apps/web/lib/queries.ts (getStudentHome / buildWeek).
import type { SupabaseClient } from "@supabase/supabase-js";
import { dayAbbr, hhmm, rel } from "./format";

const DAY_MS = 864e5;

export type SessionType = "cours" | "open";

export interface UpcomingSession {
  id: string;
  type: SessionType;
  title: string;
  day: string;
  meta: string;
  ts: number;
}

export interface StudentHome {
  name: string;
  coachId: string | null;
  health: number | null;
  factors: { label: string; value: number }[];
  program: { id: string; title: string; status: string } | null;
  lastMessage: { body: string; fromCoach: boolean; time: string } | null;
  nextSession: UpcomingSession | null;
}

const FR_FACTORS: Record<string, string> = {
  attendance: "Assiduité",
  adherence: "Adhérence",
  responsiveness: "Réactivité",
  progression: "Progression",
};

type ClassRow = { id: string; title: string; capacity: number; starts_at: string };
type OpenRow = { id: string; title: string; host_name: string; is_open: boolean; starts_at: string };

/** Séances à venir (cours + séances ouvertes) sur un horizon de `horizonDays` jours, triées. */
async function fetchUpcoming(supabase: SupabaseClient, coachId: string, horizonDays: number): Promise<UpcomingSession[]> {
  const [classRes, openRes] = await Promise.all([
    supabase.from("classes").select("id, title, capacity, starts_at").eq("coach_id", coachId),
    supabase.from("open_sessions").select("id, title, host_name, is_open, starts_at").eq("coach_id", coachId),
  ]);
  const now = Date.now();
  const horizon = now + horizonDays * DAY_MS;
  const items: UpcomingSession[] = [];

  for (const c of (classRes.data ?? []) as ClassRow[]) {
    const t = new Date(c.starts_at).getTime();
    if (t >= now - DAY_MS && t <= horizon) {
      items.push({ id: c.id, type: "cours", title: c.title, day: dayAbbr(c.starts_at), meta: `${hhmm(c.starts_at)} · ${c.capacity} pl.`, ts: t });
    }
  }
  for (const o of (openRes.data ?? []) as OpenRow[]) {
    if (!o.is_open) continue;
    const t = new Date(o.starts_at).getTime();
    if (t >= now - DAY_MS && t <= horizon) {
      items.push({ id: o.id, type: "open", title: o.title, day: dayAbbr(o.starts_at), meta: `${hhmm(o.starts_at)} · ${o.host_name}`, ts: t });
    }
  }
  return items.sort((a, b) => a.ts - b.ts);
}

export async function getStudentHome(supabase: SupabaseClient, studentId: string): Promise<StudentHome> {
  const { data: profile } = await supabase.from("profiles").select("full_name, coach_id").eq("id", studentId).maybeSingle();
  const coachId = (profile?.coach_id as string | null) ?? null;

  const [hsRes, progRes, lastMsgRes, upcoming] = await Promise.all([
    supabase.from("health_scores").select("score, factors").eq("student_id", studentId).maybeSingle(),
    supabase.from("programs").select("id, title, status").eq("student_id", studentId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("messages").select("body, sender, created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    coachId ? fetchUpcoming(supabase, coachId, 8) : Promise.resolve([] as UpcomingSession[]),
  ]);

  const factors = (hsRes.data?.factors ?? {}) as Record<string, number>;

  return {
    name: (profile?.full_name as string) ?? "Élève",
    coachId,
    health: (hsRes.data?.score as number | null) ?? null,
    factors: Object.entries(factors).map(([k, v]) => ({ label: FR_FACTORS[k] ?? k, value: v })),
    program: progRes.data ? { id: progRes.data.id as string, title: progRes.data.title as string, status: progRes.data.status as string } : null,
    lastMessage: lastMsgRes.data
      ? { body: lastMsgRes.data.body as string, fromCoach: lastMsgRes.data.sender === "coach", time: rel(lastMsgRes.data.created_at as string) }
      : null,
    nextSession: upcoming[0] ?? null,
  };
}

/** Planning complet des séances à venir (14 j) pour l'élève. */
export async function getStudentPlanning(supabase: SupabaseClient, studentId: string): Promise<UpcomingSession[]> {
  const { data: profile } = await supabase.from("profiles").select("coach_id").eq("id", studentId).maybeSingle();
  const coachId = (profile?.coach_id as string | null) ?? null;
  if (!coachId) return [];
  return fetchUpcoming(supabase, coachId, 14);
}
