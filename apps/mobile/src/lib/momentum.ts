// Momentum — logique de progression visible (jalons, badges).
// Pure et sans dépendance. Miroir de apps/web/lib/momentum.ts : garder les deux
// alignés (même barème de jalons) tant qu'il n'y a pas de package partagé.

export type BadgeTier = "sessions" | "streak" | "pr";

export interface MomentumStats {
  totalSessions: number; // séances loguées (session_ref distincts)
  streakWeeks: number; // semaines actives consécutives
  prCount: number; // nombre de records personnels
}

export interface Badge {
  id: string;
  tier: BadgeTier;
  label: string;
  caption: string;
  target: number;
  current: number;
  unlocked: boolean;
}

interface Milestone {
  target: number;
  label: string;
  caption: string;
}

const TRACKS: Record<BadgeTier, Milestone[]> = {
  sessions: [
    { target: 1, label: "Première séance", caption: "Le plus dur, c'est de commencer" },
    { target: 10, label: "Le rythme", caption: "10 séances loguées" },
    { target: 25, label: "Régulier", caption: "25 séances au compteur" },
    { target: 50, label: "Machine", caption: "50 séances, du sérieux" },
    { target: 100, label: "Centurion", caption: "100 séances, respect" },
  ],
  streak: [
    { target: 2, label: "En route", caption: "2 semaines d'affilée" },
    { target: 4, label: "Un mois plein", caption: "4 semaines sans lâcher" },
    { target: 8, label: "Ancré", caption: "8 semaines de suite" },
    { target: 12, label: "Un trimestre", caption: "12 semaines, une habitude" },
  ],
  pr: [
    { target: 1, label: "Premier record", caption: "Une première charge battue" },
    { target: 5, label: "Ça progresse", caption: "5 records personnels" },
    { target: 10, label: "Plus fort", caption: "10 records personnels" },
  ],
};

const VALUE_BY_TIER: Record<BadgeTier, (s: MomentumStats) => number> = {
  sessions: (s) => s.totalSessions,
  streak: (s) => s.streakWeeks,
  pr: (s) => s.prCount,
};

/**
 * Pour chaque piste : les jalons déjà débloqués plus le prochain objectif.
 * Débloqués d'abord (les plus exigeants en tête), l'objectif en cours à la fin.
 */
export function computeBadges(stats: MomentumStats): Badge[] {
  const tiers: BadgeTier[] = ["sessions", "streak", "pr"];
  const badges: Badge[] = [];

  for (const tier of tiers) {
    const current = VALUE_BY_TIER[tier](stats);
    const milestones = TRACKS[tier];
    const unlocked = milestones.filter((m) => current >= m.target);
    const next = milestones.find((m) => current < m.target);

    for (const m of unlocked) {
      badges.push({ id: `${tier}-${m.target}`, tier, label: m.label, caption: m.caption, target: m.target, current, unlocked: true });
    }
    if (next) {
      badges.push({ id: `${tier}-${next.target}`, tier, label: next.label, caption: next.caption, target: next.target, current, unlocked: false });
    }
  }

  return badges.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return b.target - a.target;
  });
}

export function unlockedCount(badges: readonly Badge[]): number {
  return badges.filter((b) => b.unlocked).length;
}
