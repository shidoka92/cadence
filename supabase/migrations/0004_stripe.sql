-- Cadence — Stripe Connect (onboarding coach)
alter table profiles
  add column stripe_account_id        text,
  add column stripe_charges_enabled   boolean not null default false,
  add column stripe_details_submitted boolean not null default false;
