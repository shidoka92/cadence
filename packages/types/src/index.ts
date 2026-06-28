/** Modèle produit Cadence — partagé web + natif. Reflète les décisions verrouillées. */

export type Role = "coach" | "student";
export interface Profile { id: string; role: Role; fullName: string; }

/* ---------- Le Plan (JSONB) : périodisation + progression hybride ----------
   Représentation par cellules : chaque exercice porte une valeur par semaine.
   over = true → override manuel (sinon la valeur suit la règle auto). */
export interface PlanCell { v: string; over?: boolean; }
export interface PlanExercise { id: string; name: string; rule?: string; flag?: string; cells: PlanCell[]; }
export interface PlanSession { id: string; name: string; exercises: PlanExercise[]; }
export interface PlanBlock { id: string; focus: string; weeks: number[]; sessions: PlanSession[]; }
export interface Plan { blocks: PlanBlock[]; }

export type ProgramStatus = "draft" | "sent" | "active" | "archived";
export interface Program {
  id: string; coachId: string; studentId: string;
  title: string; plan: Plan; version: number; status: ProgramStatus;
}

/* ---------- Annotation (Plan read-only sauf commentaire) ---------- */
export type AnnotationStatus = "sent" | "seen" | "addressed";
export interface Annotation {
  id: string; programId: string;
  anchor: { sessionId?: string; exerciseId?: string };
  author: Role; body: string; status: AnnotationStatus;
}

/* ---------- Le Journal (exécution réelle, normalisé) ---------- */
export interface JournalEntry {
  id: string; studentId: string; sessionRef: string;
  exercise: string; load?: number; reps?: number; rpe?: number;
  note?: string; createdAt: string;
}

/* ---------- Planning hybride ---------- */
export type ClassPricing = "included" | "paid";
export interface Klass {
  id: string; coachId: string; title: string;
  capacity: number; level: string; pricing: ClassPricing; price?: number; startsAt: string;
}
export interface OpenSession {
  id: string; hostStudentId: string; title: string;
  level: string; slots: number; isOpen: boolean; startsAt: string;
}

/* ---------- Facturation & gating ---------- */
export type SubscriptionStatus = "active" | "past_due" | "canceled";
export interface Subscription { id: string; studentId: string; coachId: string; status: SubscriptionStatus; }

/* ---------- Health Score (signature) ---------- */
export interface HealthScore {
  studentId: string; score: number;
  factors: { attendance: number; adherence: number; responsiveness: number; progression: number };
  computedAt: string;
}
