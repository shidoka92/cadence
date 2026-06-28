const arena = require("./arena.json");

/** Preset Tailwind exposant les tokens Arena : bg-bg, text-acid, font-display, etc. */
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: arena.colors.bg, surf: arena.colors.surf, surf2: arena.colors.surf2,
        hover: arena.colors.hover, line: arena.colors.line, line2: arena.colors.line2,
        text: arena.colors.text, muted: arena.colors.muted, ghost: arena.colors.ghost,
        acid: arena.colors.acid, "on-acid": arena.colors.onAcid, ok: arena.colors.ok,
        risk: arena.colors.risk, warn: arena.colors.warn, violet: arena.colors.violet
      },
      fontFamily: {
        display: ["Oswald", "Impact", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["Space Mono", "ui-monospace", "monospace"]
      },
      borderRadius: arena.radii
    }
  }
};
