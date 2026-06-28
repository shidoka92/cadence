import { AlertTriangle, MessageSquare, RefreshCw, Check, Mail, Plus, type LucideIcon } from "lucide-react";

export const kpis = [
  { label: "Élèves actifs", value: "24", trend: "↑ +2 ce mois" },
  { label: "Revenus récurrents", value: "1896€", trend: "↑ +79€ / mois", accent: true },
  { label: "Séances cette sem.", value: "6", trend: "2 cours · 4 ouvertes" },
  { label: "À traiter", value: "7", trend: "dont 1 signalement" },
];

type Action = { icon: LucideIcon; iconClass: string; title: string; bold: string; sub: string; time: string };
export const actions: Action[] = [
  { icon: AlertTriangle, iconClass: "bg-risk/15 text-risk", bold: "Séance ouverte signalée", title: " — « Run extérieur »", sub: "par Léa P. · à modérer", time: "1 H" },
  { icon: MessageSquare, iconClass: "bg-acid/15 text-acid", bold: "Lucas M.", title: " a commenté son programme", sub: "Développé couché · douleur coude → réviser", time: "2 H" },
  { icon: RefreshCw, iconClass: "bg-violet/15 text-violet", bold: "Maxime D.", title: " a terminé son bloc", sub: "Programme à renouveler · version suivante", time: "AUJ." },
  { icon: Check, iconClass: "bg-ok/15 text-ok", bold: "Karim L.", title: " a loggé sa séance Pull", sub: "RPE 9 sur tractions · feedback attendu", time: "4 H" },
  { icon: Mail, iconClass: "bg-surf2 text-muted", bold: "Inès R.", title: " — nouveau message", sub: "« Je peux décaler ma séance de vendredi ? »", time: "5 H" },
  { icon: Plus, iconClass: "bg-acid/15 text-acid", bold: "Thomas B.", title: " vient de s'abonner", sub: "Aucun programme assigné · à démarrer", time: "HIER" },
];

export const riskStudents = [
  { initials: "SD", name: "Sofia D.", score: 38, why: "Aucune séance depuis 9 jours" },
  { initials: "HM", name: "Hugo M.", score: 54, why: "Adhérence 45 % ce mois (en baisse)" },
  { initials: "NK", name: "Nadia K.", score: 61, why: "Progression stagnante · 3 semaines" },
];

export const week = [
  { day: "Lun", type: "cours" as const, title: "HIIT collectif", meta: "18:30 · 6/10" },
  { day: "Mer", type: "cours" as const, title: "Atelier squat", meta: "12:00 · 3/6" },
  { day: "Mer", type: "open" as const, title: "Jambes · Karim", meta: "19:00" },
  { day: "Ven", type: "cours" as const, title: "HIIT collectif", meta: "18:30 · 2/10" },
];

/* ---------- Fiche élève (mock) ---------- */
export const studentDetail = {
  id: "lucas",
  initials: "LM",
  name: "Lucas M.",
  meta: "Prise de masse · Intermédiaire · membre depuis mars 2026",
  subscription: "Abonné · 79€/mois",
  flag: "Douleur coude signalée",
  health: { score: 74, trend: "↓ 7 sur 30 j (était 81)" },
  factors: [
    { label: "Assiduité", value: 82 },
    { label: "Adhérence", value: 64 },
    { label: "Réactivité", value: 90 },
    { label: "Progression", value: 58 },
  ],
  evolution: {
    metric: "Charge · Développé couché",
    data: [60, 62.5, 65, 67.5, 67.5, 70, 70, 69],
    labels: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],
    yMin: 60, yMax: 70,
  },
  program: { title: "Prépa Force", meta: "BLOC 1 · HYPERTROPHIE · SEMAINE 3 / 12", progress: 25, previous: "Recomp 8 sem · terminé" },
  journal: [
    { day: "Mer", name: "Pull", data: "tractions 4×8 +5kg · RPE 9", flag: "douleur coude" },
    { day: "Lun", name: "Push", data: "dév. couché 4×8 · 67,5kg · RPE 8", ok: true },
    { day: "Ven", name: "Legs", data: "squat 5×5 · 90kg · RPE 8", ok: true },
    { day: "−9j", name: "Pull", data: "séance non rapportée", missed: true },
  ],
};

/* ---------- Planning coach (semaine) ---------- */
import type { PlanningEventData } from "@/components/coach/planning-event";
export const planningWeek: { label: string; days: { day: string; date: string; events: PlanningEventData[] }[] } = {
  label: "Semaine du 24 — 30 juin",
  days: [
    { day: "Lun", date: "24", events: [
      { type: "cours", title: "HIIT collectif", time: "18:30", capacity: "6/10", level: "Tous niveaux", pricing: "included" },
    ]},
    { day: "Mar", date: "25", events: [] },
    { day: "Mer", date: "26", events: [
      { type: "cours", title: "Atelier squat", time: "12:00", capacity: "3/6", level: "Intermédiaire", pricing: "paid", price: "15€" },
      { type: "open", title: "Jambes · gros volume", time: "19:00", host: "Lucas M.", slots: "1/2" },
    ]},
    { day: "Jeu", date: "27", events: [
      { type: "open", title: "Séance Pull", time: "18:00", host: "Karim L.", slots: "0/3", flagged: true },
    ]},
    { day: "Ven", date: "28", events: [
      { type: "cours", title: "HIIT collectif", time: "18:30", capacity: "2/10", level: "Tous niveaux", pricing: "included" },
    ]},
    { day: "Sam", date: "29", events: [] },
    { day: "Dim", date: "30", events: [] },
  ],
};

/* ---------- Éditeur : Plan périodisé (mock riche) ---------- */
export type EditorCell = { v: string; over?: boolean };
export type EditorExercise = { name: string; rule: string; flag?: string; cells: EditorCell[] };
export type EditorSession = { id: string; name: string; exercises: EditorExercise[] };
export type EditorBlock = { id: string; focus: string; color: "acid" | "violet" | "warn"; weeks: number[]; sessions: EditorSession[] };

export const editorPlan: { title: string; student: string; version: number; status: string; blocks: EditorBlock[] } = {
  title: "Prépa Force", student: "Lucas M.", version: 3, status: "active",
  blocks: [
    { id: "b1", focus: "Hypertrophie", color: "acid", weeks: [1, 2, 3, 4], sessions: [
      { id: "push", name: "Push", exercises: [
        { name: "Développé couché", rule: "+2,5 kg/sem", cells: [{ v: "67,5" }, { v: "70" }, { v: "72,5" }, { v: "70", over: true }] },
        { name: "Dév. incliné hlt", rule: "+1 kg/sem", cells: [{ v: "24" }, { v: "25" }, { v: "26" }, { v: "24", over: true }] },
        { name: "Élévations lat.", rule: "RPE 8", cells: [{ v: "10" }, { v: "10" }, { v: "12", over: true }, { v: "10" }] },
      ]},
      { id: "pull", name: "Pull", exercises: [
        { name: "Tractions lestées", rule: "+1 rep/sem", flag: "coude", cells: [{ v: "+5" }, { v: "+5" }, { v: "+7,5", over: true }, { v: "+5" }] },
        { name: "Rowing barre", rule: "+2,5 kg/sem", cells: [{ v: "60" }, { v: "62,5" }, { v: "65" }, { v: "60", over: true }] },
      ]},
      { id: "legs", name: "Legs", exercises: [
        { name: "Squat", rule: "+2,5 kg/sem", cells: [{ v: "90" }, { v: "92,5" }, { v: "95" }, { v: "90", over: true }] },
      ]},
    ]},
    { id: "b2", focus: "Force", color: "violet", weeks: [5, 6, 7, 8], sessions: [
      { id: "upper", name: "Upper", exercises: [{ name: "Développé couché", rule: "+2,5 kg/sem", cells: [{ v: "75" }, { v: "77,5" }, { v: "80" }, { v: "77,5", over: true }] }] },
      { id: "lower", name: "Lower", exercises: [{ name: "Squat", rule: "+5 kg/sem", cells: [{ v: "100" }, { v: "105" }, { v: "110" }, { v: "105", over: true }] }] },
    ]},
    { id: "b3", focus: "Peak", color: "warn", weeks: [9, 10], sessions: [
      { id: "full", name: "Full body", exercises: [{ name: "Squat", rule: "taper", cells: [{ v: "95" }, { v: "85" }] }] },
    ]},
  ],
};
