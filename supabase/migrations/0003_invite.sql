-- Cadence — onboarding élève par invitation

-- Infos publiques d'un token (sans exposer la table invitations)
create or replace function invitation_info(p_token text)
returns table (valid boolean, coach_name text)
language sql stable security definer set search_path = public as $$
  select (i.status = 'pending') as valid, p.full_name as coach_name
  from invitations i
  join profiles p on p.id = i.coach_id
  where i.token = p_token;
$$;
grant execute on function invitation_info(text) to anon, authenticated;

-- Acceptation : crée le profil élève, le lie au coach du token, marque l'invitation utilisée.
-- Le coach_id vient du token côté serveur — l'élève ne peut pas le falsifier.
create or replace function accept_invitation(p_token text, p_full_name text)
returns void language plpgsql security definer set search_path = public as $$
declare v_coach uuid;
begin
  select coach_id into v_coach from invitations where token = p_token and status = 'pending';
  if v_coach is null then
    raise exception 'Invitation invalide ou déjà utilisée';
  end if;

  insert into profiles (id, role, full_name, coach_id)
  values (auth.uid(), 'student', p_full_name, v_coach)
  on conflict (id) do update
    set role = 'student', full_name = excluded.full_name, coach_id = v_coach;

  update invitations set status = 'accepted' where token = p_token;
end;
$$;
grant execute on function accept_invitation(text, text) to authenticated;
