import arena from "../arena.json";

/** Design system Arena — single source of truth (partagé web + natif). */
export const colors = arena.colors;
export const fonts = arena.fonts;
export const radii = arena.radii;
export const arenaTokens = arena;
export type ArenaColor = keyof typeof arena.colors;
