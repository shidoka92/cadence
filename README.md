# Cadence

SaaS de coaching sportif. Monorepo Turborepo.

## Structure
- `apps/web`    — app coach (Next.js, Vercel)
- `apps/mobile` — app élève (Expo, phase 2)
- `packages/tokens` — design system Arena (partagé web/natif)
- `packages/types`  — modèle produit (Plan, Journal, etc.)
- `packages/db`     — client Supabase + types générés
- `supabase/`       — migrations SQL + RLS

## Démarrer
```bash
pnpm install
pnpm dev          # lance apps/web sur http://localhost:3000
```

## Déployer le coach (Vercel)
```bash
# depuis apps/web, ou pointer le Root Directory Vercel sur apps/web
vercel
```
Variables d'env requises : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
