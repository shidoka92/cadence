import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "@cadence/types";
import type { PlanningEventData } from "@/components/coach/planning-event";

/* ---------- helpers ---------- */
const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const FR_FACTORS: Record<string, string> = {
  attendance: "Assiduité", adherence: "Adhérence", responsiveness: "Réactivité", progression: "Progression",
};
function rel(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6);
  if (h < 1) return "à l'instant";
  if (h < 24) return `${h} H`;
  const d = Math.floor(h / 24);
  return d === 1 ? "HIER" : `${d} J`;
}
function dayAbbr(iso: string) { return DAYS[new Date(iso).getDay()]; }
function hhmm(iso: string) { return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
function num(v: string) { return parseFloat(v.replace(",", ".").replace("+", "").replace(/[^\d.]/g, "")); }

/* ---------- Dashboard ---------- */
export type QueueItem = { kind: "annotation" | "newstudent" | "sub"; bold: string; title: string; sub: string; time: string };
export type RiskItem = { id: string; name: string; score: number; why: string };
export type WeekItem = { day: string; type: "cours" | "open"; title: string; meta: string };

export async function getDashboard(supabase: SupabaseClient, coachId: string) {
  const { data: students = [] } = await supabase.from("profiles").select("id, full_name").eq("coach_id", coachId);
  const ids = students!.map((s) => s.id);
  const nameOf: Record<string, string> = Object.fromEntries(students!.map((s) => [s.id, s.full_name]));

  const [hsRes, subsRes, progRes, classRes, openRes] = await Promise.all([
    ids.length ? supabase.from("health_scores").select("student_id, score, factors").in("student_id", ids) : Promise.resolve({ data: [] as any[] }),
    supabase.from("subscriptions").select("status").eq("coach_id", coachId),
    supabase.from("programs").select("id, student_id").eq("coach_id", coachId),
    supabase.from("classes").select("title, starts_at, capacity").eq("coach_id", coachId),
    supabase.from("open_sessions").select("title, starts_at, host_name, is_open").eq("coach_id", coachId),
  ]);

  const programs = progRes.data ?? [];
  const progStudent: Record<string, string> = Object.fromEntries(programs.map((p: any) => [p.id, p.student_id]));
  const studentsWithProgram = new Set(programs.map((p: any) => p.student_id));

  const { data: annots = [] } = programs.length
    ? await supabase.from("program_annotations").select("program_id, body, created_at").eq("author", "student").in("program_id", programs.map((p: any) => p.id)).order("created_at", { ascending: false }).limit(4)
    : { data: [] as any[] };

  // KPIs
  const activeSubs = (subsRes.data ?? []).filter((s: any) => s.status === "active").length;
  const week = buildWeek(classRes.data ?? [], openRes.data ?? []);
  const queue: QueueItem[] = [];
  for (const a of annots!) {
    queue.push({ kind: "annotation", bold: nameOf[progStudent[a.program_id]] ?? "Élève", title: " a commenté son programme", sub: a.body.slice(0, 60), time: rel(a.created_at) });
  }
  for (const s of students!) {
    if (!studentsWithProgram.has(s.id)) queue.push({ kind: "newstudent", bold: s.full_name, title: " — aucun programme", sub: "à démarrer", time: "" });
  }

  const kpis = [
    { label: "Élèves actifs", value: String(students!.length), trend: "" },
    { label: "Abonnés actifs", value: String(activeSubs), trend: `${(subsRes.data ?? []).length} au total`, accent: true },
    { label: "Séances cette sem.", value: String(week.length), trend: "" },
    { label: "À traiter", value: String(queue.length), trend: "" },
  ];

  // Risque
  const risk: RiskItem[] = (hsRes.data ?? [])
    .filter((h: any) => h.score < 70)
    .sort((a: any, b: any) => a.score - b.score)
    .slice(0, 3)
    .map((h: any) => ({ id: h.student_id, name: nameOf[h.student_id] ?? "Élève", score: h.score, why: lowestFactor(h.factors) }));

  return { kpis, queue, risk, week };
}

function lowestFactor(factors: Record<string, number> | null) {
  if (!factors) return "Health Score en baisse";
  const entries = Object.entries(factors);
  if (!entries.length) return "Health Score en baisse";
  const [k, v] = entries.sort((a, b) => a[1] - b[1])[0];
  return `${FR_FACTORS[k] ?? k} ${v}%`;
}

function buildWeek(classes: any[], opens: any[]): WeekItem[] {
  const now = Date.now();
  const horizon = now + 8 * 864e5;
  const items: (WeekItem & { ts: number })[] = [];
  for (const c of classes) {
    const t = new Date(c.starts_at).getTime();
    if (t >= now - 864e5 && t <= horizon) items.push({ ts: t, day: dayAbbr(c.starts_at), type: "cours", title: c.title, meta: `${hhmm(c.starts_at)} · ${c.capacity} pl.` });
  }
  for (const o of opens) {
    if (!o.is_open) continue;
    const t = new Date(o.starts_at).getTime();
    if (t >= now - 864e5 && t <= horizon) items.push({ ts: t, day: dayAbbr(o.starts_at), type: "open", title: o.title, meta: `${hhmm(o.starts_at)} · ${o.host_name}` });
  }
  return items.sort((a, b) => a.ts - b.ts).map(({ ts, ...rest }) => rest);
}

/* ---------- Liste élèves ---------- */
export async function getRoster(supabase: SupabaseClient, coachId: string) {
  const { data: students = [] } = await supabase.from("profiles").select("id, full_name").eq("coach_id", coachId).order("full_name");
  const ids = students!.map((s) => s.id);
  const { data: hs = [] } = ids.length ? await supabase.from("health_scores").select("student_id, score").in("student_id", ids) : { data: [] as any[] };
  const scoreOf: Record<string, number> = Object.fromEntries(hs!.map((h: any) => [h.student_id, h.score]));
  return students!.map((s) => ({ id: s.id, name: s.full_name, initials: initials(s.full_name), score: scoreOf[s.id] ?? 0 }));
}

function initials(name: string) { return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(); }

/* ---------- Fiche élève ---------- */
export async function getStudentDetail(supabase: SupabaseClient, studentId: string) {
  const [profRes, hsRes, progRes, subRes, jourRes] = await Promise.all([
    supabase.from("profiles").select("full_name, objective, level, injuries").eq("id", studentId).single(),
    supabase.from("health_scores").select("score, factors").eq("student_id", studentId).maybeSingle(),
    supabase.from("programs").select("id, title, plan, status").eq("student_id", studentId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("subscriptions").select("status").eq("student_id", studentId).maybeSingle(),
    supabase.from("journal_entries").select("session_ref, exercise, load, reps, rpe, note, created_at").eq("student_id", studentId).order("created_at", { ascending: false }).limit(5),
  ]);

  const prof = profRes.data;
  if (!prof) return null;

  const factors = (hsRes.data?.factors ?? {}) as Record<string, number>;
  const plan = progRes.data?.plan as Plan | undefined;

  return {
    name: prof.full_name,
    initials: initials(prof.full_name),
    meta: [prof.objective, prof.level].filter(Boolean).join(" · "),
    subscription: subRes.data?.status === "active" ? "Abonné · actif" : subRes.data?.status === "past_due" ? "Paiement en retard" : "Sans abonnement",
    subOk: subRes.data?.status === "active",
    flag: prof.injuries as string | null,
    health: { score: hsRes.data?.score ?? 0 },
    factors: Object.entries(factors).map(([k, v]) => ({ label: FR_FACTORS[k] ?? k, value: v })),
    evolution: planEvolution(plan),
    program: plan ? { id: progRes.data!.id as string, title: progRes.data!.title, meta: `${plan.blocks.length} blocs · ${plan.blocks.reduce((n, b) => n + b.weeks.length, 0)} sem`, status: progRes.data!.status } : null,
    journal: (jourRes.data ?? []).map((j: any) => ({
      day: dayAbbr(j.created_at),
      name: j.exercise,
      data: [j.load != null ? `${j.load} kg` : null, j.reps != null ? `${j.reps} reps` : null, j.rpe != null ? `RPE ${j.rpe}` : null].filter(Boolean).join(" · ") || (j.note ?? ""),
      flag: j.note && /douleur|coude|gêne/i.test(j.note) ? j.note : null,
    })),
  };
}

/** Évolution dérivée du Plan : la charge d'un même exercice (ex. développé couché) à travers les blocs. */
function planEvolution(plan: Plan | undefined) {
  if (!plan) return null;
  const target = "couché";
  const data: number[] = [];
  for (const b of plan.blocks) {
    for (const s of b.sessions) {
      const ex = s.exercises.find((e) => e.name.toLowerCase().includes(target));
      if (ex) ex.cells.forEach((c) => { const n = num(c.v); if (!isNaN(n)) data.push(n); });
    }
  }
  if (data.length < 2) return null;
  const labels = data.map((_, i) => `S${i + 1}`);
  return { metric: "Charge · Développé couché", data, labels, yMin: Math.min(...data), yMax: Math.max(...data) };
}

/* ---------- Planning (semaine glissante) ---------- */

const DAYS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function countBy<T>(rows: T[], key: keyof T) {
  const m: Record<string, number> = {};
  for (const r of rows) { const k = String(r[key]); m[k] = (m[k] ?? 0) + 1; }
  return m;
}

export async function getPlanningWeek(supabase: SupabaseClient, coachId: string) {
  const [classRes, openRes] = await Promise.all([
    supabase.from("classes").select("id, title, starts_at, capacity, level, pricing, price").eq("coach_id", coachId),
    supabase.from("open_sessions").select("id, title, starts_at, host_name, slots, is_open").eq("coach_id", coachId),
  ]);
  const classes = classRes.data ?? [];
  const opens = openRes.data ?? [];

  const classIds = classes.map((c: any) => c.id);
  const { data: enrolls = [] } = classIds.length
    ? await supabase.from("class_enrollments").select("class_id").in("class_id", classIds)
    : { data: [] as any[] };
  const enrolledOf = countBy(enrolls as any[], "class_id" as any);

  const openIds = opens.map((o: any) => o.id);
  const { data: reqs = [] } = openIds.length
    ? await supabase.from("open_session_requests").select("session_id, status").in("session_id", openIds)
    : { data: [] as any[] };
  const acceptedOf: Record<string, number> = {};
  for (const r of reqs as any[]) if (r.status === "accepted") acceptedOf[r.session_id] = (acceptedOf[r.session_id] ?? 0) + 1;

  const start = new Date(); start.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * 864e5);
    const events: PlanningEventData[] = [];
    for (const c of classes as any[]) {
      if (sameDay(new Date(c.starts_at), d))
        events.push({ type: "cours", title: c.title, time: hhmm(c.starts_at), capacity: `${enrolledOf[c.id] ?? 0}/${c.capacity}`, level: c.level ?? "", pricing: c.pricing, price: c.price != null ? `${c.price}€` : undefined });
    }
    for (const o of opens as any[]) {
      if (!o.is_open) continue;
      if (sameDay(new Date(o.starts_at), d))
        events.push({ type: "open", title: o.title, time: hhmm(o.starts_at), host: o.host_name, slots: `${acceptedOf[o.id] ?? 0}/${o.slots}` });
    }
    events.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
    days.push({ day: DAYS_SHORT[d.getDay()], date: String(d.getDate()), events });
  }
  const end = new Date(start.getTime() + 6 * 864e5);
  const fmt = (x: Date) => x.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  return { label: `${fmt(start)} — ${fmt(end)}`, days };
}

/* ---------- Planning (fenêtre glissante 7 jours) ---------- */

export async function getPlanning(supabase: SupabaseClient, coachId: string) {
  const [classRes, openRes] = await Promise.all([
    supabase.from("classes").select("id, title, capacity, level, pricing, price, starts_at").eq("coach_id", coachId),
    supabase.from("open_sessions").select("title, host_name, slots, is_open, starts_at").eq("coach_id", coachId),
  ]);
  const classes = classRes.data ?? [];
  const opens = (openRes.data ?? []).filter((o: any) => o.is_open);

  // compteur d'inscrits par cours
  const classIds = classes.map((c: any) => c.id);
  const { data: enrolls = [] } = classIds.length
    ? await supabase.from("class_enrollments").select("class_id").in("class_id", classIds)
    : { data: [] as any[] };
  const enrolled: Record<string, number> = {};
  for (const e of enrolls!) enrolled[e.class_id] = (enrolled[e.class_id] ?? 0) + 1;

  // 7 jours à partir d'aujourd'hui
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const days: { day: string; date: string; events: PlanningEventData[] }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const a = d.getTime(), b = a + 864e5;
    const events: PlanningEventData[] = [];
    for (const c of classes) {
      const t = new Date(c.starts_at).getTime();
      if (t >= a && t < b) events.push({ type: "cours", title: c.title, time: hhmm(c.starts_at), capacity: `${enrolled[c.id] ?? 0}/${c.capacity}`, level: c.level ?? "", pricing: c.pricing, price: c.price ? `${c.price}€` : undefined });
    }
    for (const o of opens) {
      const t = new Date(o.starts_at).getTime();
      if (t >= a && t < b) events.push({ type: "open", title: o.title, time: hhmm(o.starts_at), host: o.host_name, slots: `${o.slots} pl.` });
    }
    events.sort((x, y) => x.time.localeCompare(y.time));
    days.push({ day: dayAbbr(d.toISOString()), date: String(d.getDate()), events });
  }
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const month = (dt: Date) => dt.toLocaleDateString("fr-FR", { month: "short" });
  const label = `${start.getDate()} ${month(start)} — ${end.getDate()} ${month(end)}`;
  return { label, days };
}

/* ---------- Programmes (liste) ---------- */
export async function getPrograms(supabase: SupabaseClient, coachId: string) {
  const { data: programs = [] } = await supabase.from("programs").select("id, title, status, plan, student_id").eq("coach_id", coachId).order("created_at", { ascending: false });
  const ids = [...new Set(programs!.map((p: any) => p.student_id))];
  const { data: profs = [] } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] as any[] };
  const nameOf: Record<string, string> = Object.fromEntries(profs!.map((p: any) => [p.id, p.full_name]));
  return programs!.map((p: any) => ({
    id: p.id, title: p.title, status: p.status, student: nameOf[p.student_id] ?? "Élève",
    blocks: p.plan?.blocks?.length ?? 0,
    weeks: (p.plan?.blocks ?? []).reduce((n: number, b: any) => n + (b.weeks?.length ?? 0), 0),
  }));
}

/* ---------- Revenus ---------- */
export async function getRevenue(supabase: SupabaseClient, coachId: string) {
  const { data: subs = [] } = await supabase.from("subscriptions").select("student_id, status").eq("coach_id", coachId);
  const ids = subs!.map((s: any) => s.student_id);
  const { data: profs = [] } = ids.length ? await supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] as any[] };
  const nameOf: Record<string, string> = Object.fromEntries(profs!.map((p: any) => [p.id, p.full_name]));
  const rows = subs!.map((s: any) => ({ name: nameOf[s.student_id] ?? "Élève", status: s.status as string }));
  return {
    active: rows.filter((r) => r.status === "active").length,
    pastDue: rows.filter((r) => r.status === "past_due").length,
    total: rows.length, rows,
  };
}

/* ---------- Messagerie ---------- */
export async function getConversations(supabase: SupabaseClient, coachId: string) {
  const { data: students = [] } = await supabase.from("profiles").select("id, full_name").eq("coach_id", coachId).order("full_name");
  const { data: msgs = [] } = await supabase.from("messages").select("student_id, body, created_at").eq("coach_id", coachId).order("created_at", { ascending: false });
  const last: Record<string, string> = {};
  for (const m of msgs!) if (!last[m.student_id]) last[m.student_id] = m.body;
  return students!.map((s) => ({ id: s.id, name: s.full_name, initials: initials(s.full_name), last: last[s.id] ?? null }));
}

export async function getThread(supabase: SupabaseClient, coachId: string, studentId: string) {
  const { data: student } = await supabase.from("profiles").select("full_name").eq("id", studentId).single();
  const { data: messages = [] } = await supabase.from("messages").select("sender, body, created_at").eq("coach_id", coachId).eq("student_id", studentId).order("created_at", { ascending: true });
  return { name: student?.full_name ?? "Élève", messages: messages! };
}
