# Supabase — Cadence

## Appliquer le schéma
```bash
supabase init            # une fois
supabase db push         # applique migrations/0001 + 0002
# ou en local : supabase start && supabase db reset
```

## Régénérer les types pour l'app
```bash
supabase gen types typescript --project-id <PROJECT_ID> > ../packages/db/src/database.types.ts
```

## Brancher l'app
1. `apps/web/.env.local` : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
2. Remplacer `lib/mock-data.ts` par des requêtes via `createSupabaseClient()`.
   Les policies RLS garantissent que chaque rôle ne voit que ce qu'il doit.

## Seed de démo (local)
```bash
supabase db reset      # applique migrations + seed.sql
```
Comptes (mot de passe : `cadence123`) — coach : `sarah@cadence.app`.
Une fois loggé en Sarah, la sidebar affiche son nom depuis la base.

## Onboarding élève (invitation)
- Côté coach : `/eleves/inviter` génère un lien `/invite/<token>`.
- Côté élève : ce lien (public) crée le compte + relie au coach via la RPC `accept_invitation`.
- ⚠️ Désactive la confirmation email dans Supabase (Auth → Providers → Email) pour un flux fluide,
  sinon l'élève doit confirmer son email avant que la liaison se fasse.
