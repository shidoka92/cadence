-- Cadence — Feature « Signal » : check-in de readiness (forme du jour).
-- L'élève déclare son état (sommeil, énergie, courbatures, humeur), on en dérive
-- un score de readiness 0-100 qui informe la charge d'entraînement.
-- `source` = 'manual' aujourd'hui ; 'healthkit' / 'googlefit' quand l'auto-sync
-- wearable sera branché (nécessite un dev build natif, hors Expo Go).

create table readiness_checkins (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references profiles(id) on delete cascade,
  date          date not null,
  sleep_hours   numeric,                       -- heures de sommeil (nullable)
  sleep_quality int,                           -- 1-5
  energy        int,                           -- 1-5
  soreness      int,                           -- 1-5 (5 = très courbaturé, pénalise)
  mood          int,                           -- 1-5
  score         int not null,                  -- readiness 0-100 (calculé côté client)
  source        text not null default 'manual',
  created_at    timestamptz not null default now(),
  unique (student_id, date)                    -- un check-in par jour, ré-éditable (upsert)
);

create index on readiness_checkins(student_id, date desc);

alter table readiness_checkins enable row level security;

-- élève : gère ses propres check-ins ; coach : lecture seule de ses élèves
-- (même pattern que journal_entries).
create policy "readiness student" on readiness_checkins for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "readiness coach read" on readiness_checkins for select
  using (exists (select 1 from profiles s where s.id = student_id and s.coach_id = auth.uid()));
