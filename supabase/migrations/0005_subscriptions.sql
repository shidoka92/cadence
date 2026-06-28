-- Cadence — Stripe Connect (abonnements + commission)

alter table profiles add column subscription_price numeric;

-- un élève a au plus un abonnement (modèle mono-coach) : la ligne est mise à jour, pas dupliquée
alter table subscriptions add constraint subscriptions_student_id_key unique (student_id);

-- Lecture publique minimale pour la page de paiement (élève non authentifié possible) :
-- nom du coach, prix, compte Connect, et si la page est utilisable / déjà payée.
create or replace function payment_link_info(p_student_id uuid)
returns table (
  student_name       text,
  coach_id           uuid,
  coach_name         text,
  stripe_account_id  text,
  price              numeric,
  payable            boolean,
  already_subscribed boolean
)
language sql stable security definer set search_path = public as $$
  select
    s.full_name,
    c.id,
    c.full_name,
    c.stripe_account_id,
    c.subscription_price,
    coalesce(c.stripe_charges_enabled, false) and c.subscription_price is not null,
    exists (
      select 1 from subscriptions sub
      where sub.student_id = p_student_id and sub.status in ('active', 'past_due')
    )
  from profiles s
  join profiles c on c.id = s.coach_id
  where s.id = p_student_id and s.role = 'student';
$$;
grant execute on function payment_link_info(uuid) to anon, authenticated;
