-- Cadence — schéma initial
-- ============ Enums ============
create type user_role             as enum ('coach','student');
create type program_status        as enum ('draft','sent','active','archived');
create type annotation_status     as enum ('sent','seen','addressed');
create type class_pricing         as enum ('included','paid');
create type request_status        as enum ('pending','accepted','declined');
create type subscription_status   as enum ('active','past_due','canceled');
create type invitation_status     as enum ('pending','accepted');

-- ============ Tables ============
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null,
  full_name   text not null,
  coach_id    uuid references profiles(id),        -- élèves : leur coach (mono-coach)
  objective   text,
  level       text,
  injuries    text,
  created_at  timestamptz not null default now()
);

create table invitations (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references profiles(id) on delete cascade,
  token       text not null unique,
  email       text,
  status      invitation_status not null default 'pending',
  created_at  timestamptz not null default now()
);

create table programs (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references profiles(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  title       text not null,
  plan        jsonb not null default '{"blocks":[]}'::jsonb,   -- Plan périodisé
  version     int  not null default 1,
  status      program_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table program_annotations (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references programs(id) on delete cascade,
  anchor      jsonb not null default '{}'::jsonb,   -- {sessionId, exerciseId}
  author      user_role not null,
  body        text not null,
  status      annotation_status not null default 'sent',
  created_at  timestamptz not null default now()
);

create table journal_entries (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  session_ref text not null,
  exercise    text not null,
  load        numeric,
  reps        int,
  rpe         int,
  note        text,
  created_at  timestamptz not null default now()
);

create table classes (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references profiles(id) on delete cascade,
  title       text not null,
  capacity    int not null,
  level       text,
  pricing     class_pricing not null default 'included',
  price       numeric,
  starts_at   timestamptz not null
);

create table class_enrollments (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  payment_id  uuid,
  created_at  timestamptz not null default now(),
  unique (class_id, student_id)
);

-- séances ouvertes (élève-driven). coach_id + host_name dénormalisés :
--   visibilité communauté sans exposer les profils des autres élèves.
create table open_sessions (
  id              uuid primary key default gen_random_uuid(),
  host_student_id uuid not null references profiles(id) on delete cascade,
  coach_id        uuid not null references profiles(id) on delete cascade,
  host_name       text not null,
  title           text not null,
  level           text,
  slots           int not null default 1,
  is_open         boolean not null default false,   -- opt-in
  starts_at       timestamptz not null
);

create table open_session_requests (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references open_sessions(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  status      request_status not null default 'pending',
  created_at  timestamptz not null default now(),
  unique (session_id, student_id)
);

create table messages (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references profiles(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  sender      user_role not null,
  body        text not null,
  system_type text,
  created_at  timestamptz not null default now()
);

create table subscriptions (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references profiles(id) on delete cascade,
  coach_id      uuid not null references profiles(id) on delete cascade,
  stripe_sub_id text,
  status        subscription_status not null default 'active',
  updated_at    timestamptz not null default now()
);

create table payments (
  id              uuid primary key default gen_random_uuid(),
  type            text not null,           -- subscription | class
  student_id      uuid references profiles(id),
  coach_id        uuid references profiles(id),
  stripe_id       text,
  amount          numeric,
  application_fee numeric,
  created_at      timestamptz not null default now()
);

create table health_scores (
  student_id  uuid primary key references profiles(id) on delete cascade,
  score       int not null,
  factors     jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null,
  payload     jsonb not null default '{}'::jsonb,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============ Index ============
create index on programs(coach_id);
create index on programs(student_id);
create index on journal_entries(student_id);
create index on messages(coach_id, student_id);
create index on classes(coach_id);
create index on open_sessions(coach_id);

-- ============ Helpers (SECURITY DEFINER : pas de récursion RLS) ============
create or replace function app_role() returns user_role
  language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function my_coach_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select coach_id from profiles where id = auth.uid();
$$;
