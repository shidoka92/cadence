-- Cadence — modèles de programmes réutilisables (par coach)
create table program_templates (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references profiles(id) on delete cascade,
  title       text not null,
  plan        jsonb not null,
  created_at  timestamptz not null default now()
);

alter table program_templates enable row level security;
create policy "templates coach" on program_templates for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
