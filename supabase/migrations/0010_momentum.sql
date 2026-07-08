-- Cadence — Momentum : classement de classe (progrès visible, rétention)
-- Un élève ne peut pas lire le journal des autres (RLS). Cette fonction
-- security definer contourne la RLS de façon contrôlée : elle n'expose que
-- des agrégats (nombre de séances sur 30 j) et le prénom, uniquement pour
-- les élèves qui partagent une classe avec l'appelant. L'identité de
-- l'appelant vient de auth.uid() : impossible de demander le classement d'autrui.

create or replace function class_leaderboard()
returns table (
  student_id   uuid,
  display_name text,
  sessions     int,
  place        int,
  is_me        boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select auth.uid() as uid
  ),
  my_classes as (
    select ce.class_id
    from class_enrollments ce, me
    where ce.student_id = me.uid
  ),
  peers as (
    select distinct ce.student_id
    from class_enrollments ce
    where ce.class_id in (select class_id from my_classes)
  ),
  counts as (
    select
      p.id as student_id,
      split_part(coalesce(nullif(trim(p.full_name), ''), 'Élève'), ' ', 1) as display_name,
      (
        select count(distinct j.session_ref)::int
        from journal_entries j
        where j.student_id = p.id
          and j.created_at >= now() - interval '30 days'
      ) as sessions
    from profiles p
    where p.id in (select student_id from peers)
  )
  select
    c.student_id,
    c.display_name,
    c.sessions,
    rank() over (order by c.sessions desc)::int as place,
    (c.student_id = (select uid from me)) as is_me
  from counts c
  order by c.sessions desc, c.display_name asc;
$$;

revoke all on function class_leaderboard() from public;
grant execute on function class_leaderboard() to authenticated;
