// Helpers de formatage date/texte — miroir de apps/web/lib/queries.ts (mêmes libellés FR).

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

/** Temps relatif court : "à l'instant", "3 H", "HIER", "4 J". */
export function rel(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6);
  if (h < 1) return "à l'instant";
  if (h < 24) return `${h} H`;
  const d = Math.floor(h / 24);
  return d === 1 ? "HIER" : `${d} J`;
}

export function dayAbbr(iso: string): string {
  return DAYS[new Date(iso).getDay()];
}

export function hhmm(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
