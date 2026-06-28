-- Cadence — Row Level Security
-- Les décisions de privacy, appliquées au niveau base.

alter table profiles             enable row level security;
alter table invitations          enable row level security;
alter table programs             enable row level security;
alter table program_annotations  enable row level security;
alter table journal_entries      enable row level security;
alter table classes              enable row level security;
alter table class_enrollments    enable row level security;
alter table open_sessions        enable row level security;
alter table open_session_requests enable row level security;
alter table messages             enable row level security;
alter table subscriptions        enable row level security;
alter table payments             enable row level security;
alter table health_scores        enable row level security;
alter table notifications        enable row level security;

-- ===== profiles : soi-même + (coach↔ses élèves) =====
create policy "profiles read" on profiles for select using (
  id = auth.uid() or coach_id = auth.uid() or id = my_coach_id()
);
create policy "profiles insert self" on profiles for insert with check (id = auth.uid());
create policy "profiles update self" on profiles for update using (id = auth.uid());

-- ===== invitations : le coach gère les siennes =====
create policy "inv coach" on invitations for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

-- ===== programs : coach gère, élève lit (read-only) =====
create policy "programs coach" on programs for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
create policy "programs student read" on programs for select
  using (student_id = auth.uid());

-- ===== annotations : Plan read-only sauf annotation =====
create policy "annot coach" on program_annotations for all
  using (exists (select 1 from programs p where p.id = program_id and p.coach_id = auth.uid()))
  with check (exists (select 1 from programs p where p.id = program_id and p.coach_id = auth.uid()));
create policy "annot student read" on program_annotations for select
  using (exists (select 1 from programs p where p.id = program_id and p.student_id = auth.uid()));
create policy "annot student write" on program_annotations for insert
  with check (author = 'student'
    and exists (select 1 from programs p where p.id = program_id and p.student_id = auth.uid()));

-- ===== journal : élève écrit le sien, coach lit ses élèves =====
create policy "journal student" on journal_entries for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "journal coach read" on journal_entries for select
  using (exists (select 1 from profiles s where s.id = student_id and s.coach_id = auth.uid()));

-- ===== classes : coach gère, élèves du coach lisent =====
create policy "classes coach" on classes for all
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());
create policy "classes student read" on classes for select
  using (coach_id = my_coach_id());

-- ===== inscriptions : élève s'inscrit, coach voit ses cours =====
create policy "enroll student" on class_enrollments for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "enroll coach read" on class_enrollments for select
  using (exists (select 1 from classes c where c.id = class_id and c.coach_id = auth.uid()));

-- ===== séances ouvertes : opt-in + scope communauté =====
create policy "open host" on open_sessions for all
  using (host_student_id = auth.uid()) with check (host_student_id = auth.uid());
create policy "open community read" on open_sessions for select
  using (is_open = true and coach_id = my_coach_id());
create policy "open coach moderate" on open_sessions for all          -- gouvernance
  using (coach_id = auth.uid()) with check (coach_id = auth.uid());

-- ===== demandes : l'hôte valide, le demandeur lit/insère la sienne =====
create policy "req host" on open_session_requests for all
  using (exists (select 1 from open_sessions o where o.id = session_id and o.host_student_id = auth.uid()))
  with check (exists (select 1 from open_sessions o where o.id = session_id and o.host_student_id = auth.uid()));
create policy "req requester read" on open_session_requests for select using (student_id = auth.uid());
create policy "req requester insert" on open_session_requests for insert with check (student_id = auth.uid());

-- ===== messages : coach + élève du fil =====
create policy "messages participants" on messages for all
  using (coach_id = auth.uid() or student_id = auth.uid())
  with check (coach_id = auth.uid() or student_id = auth.uid());

-- ===== subscriptions : lecture seule (écriture via webhook Stripe / service role) =====
create policy "subs student read" on subscriptions for select using (student_id = auth.uid());
create policy "subs coach read"   on subscriptions for select using (coach_id   = auth.uid());

-- ===== health scores : élève lit le sien, coach ses élèves =====
create policy "hs student" on health_scores for select using (student_id = auth.uid());
create policy "hs coach"   on health_scores for select
  using (exists (select 1 from profiles s where s.id = student_id and s.coach_id = auth.uid()));

-- ===== notifications : propriétaire =====
create policy "notif owner" on notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- NB : subscriptions / payments sont écrits par les webhooks Stripe via la
--      service_role key, qui bypass la RLS. Aucune policy d'écriture côté user.
