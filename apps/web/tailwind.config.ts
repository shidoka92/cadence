import type { Config } from "tailwindcss";
import arenaPreset from "@cadence/tokens/tailwind-preset";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [arenaPreset],
} satisfies Config;
