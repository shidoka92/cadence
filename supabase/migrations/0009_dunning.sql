-- Cadence — impayés : client Stripe de l'élève (pour le Billing Portal)
alter table profiles add column stripe_customer_id text;
