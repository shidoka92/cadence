-- Cadence — Stripe Connect (revenus réels)

-- évite les doublons si Stripe redélivre le même événement de facture
alter table payments add constraint payments_stripe_id_key unique (stripe_id);

-- payments était en RLS activée sans policy (écriture service role uniquement) :
-- le coach doit pouvoir lire ses propres paiements pour la page Revenus.
create policy "payments coach read" on payments for select using (coach_id = auth.uid());
