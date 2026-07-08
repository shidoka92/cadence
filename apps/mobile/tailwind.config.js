// Design system Arena partagé avec le web via NativeWind (mêmes tokens).
const arena = require("../../packages/tokens/arena.json");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: arena.colors.bg,
        surf: arena.colors.surf,
        surf2: arena.colors.surf2,
        hover: arena.colors.hover,
        line: arena.colors.line,
        line2: arena.colors.line2,
        text: arena.colors.text,
        muted: arena.colors.muted,
        ghost: arena.colors.ghost,
        acid: arena.colors.acid,
        onAcid: arena.colors.onAcid,
        ok: arena.colors.ok,
        risk: arena.colors.risk,
        warn: arena.colors.warn,
        violet: arena.colors.violet,
      },
      borderRadius: {
        sm: arena.radii.sm,
        md: arena.radii.md,
        lg: arena.radii.lg,
      },
    },
  },
  plugins: [],
};
