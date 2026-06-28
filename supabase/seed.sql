-- Cadence — seed de démo
-- Lancé par `supabase db reset` (local) après les migrations.
-- Comptes créés (mot de passe commun : cadence123) :
--   coach : sarah@cadence.app   |   élèves : lucas/ sofia / hugo / nadia @cadence.app

create extension if not exists pgcrypto;

-- helper : crée un user auth + son identité email
create or replace function seed_auth_user(uid uuid, mail text, pass text)
returns void language plpgsql as $func$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail,
    crypt(pass, gen_salt('bf')), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}', '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', mail), 'email', now(), now(), now()
  );
end;
$func$;

-- ===== Auth users =====
select seed_auth_user('11111111-1111-1111-1111-111111111111', 'sarah@cadence.app', 'cadence123'); -- coach
select seed_auth_user('22222222-2222-2222-2222-222222222222', 'lucas@cadence.app', 'cadence123');
select seed_auth_user('33333333-3333-3333-3333-333333333333', 'sofia@cadence.app', 'cadence123');
select seed_auth_user('44444444-4444-4444-4444-444444444444', 'hugo@cadence.app',  'cadence123');
select seed_auth_user('55555555-5555-5555-5555-555555555555', 'nadia@cadence.app', 'cadence123');

-- ===== Profiles =====
insert into profiles (id, role, full_name, coach_id, objective, level, injuries) values
  ('11111111-1111-1111-1111-111111111111', 'coach',   'Sarah Bauer', null, null, null, null),
  ('22222222-2222-2222-2222-222222222222', 'student', 'Lucas M.', '11111111-1111-1111-1111-111111111111', 'Prise de masse', 'Intermédiaire', 'Douleur coude (droite)'),
  ('33333333-3333-3333-3333-333333333333', 'student', 'Sofia D.', '11111111-1111-1111-1111-111111111111', 'Remise en forme', 'Débutant', null),
  ('44444444-4444-4444-4444-444444444444', 'student', 'Hugo M.',  '11111111-1111-1111-1111-111111111111', 'Force', 'Intermédiaire', null),
  ('55555555-5555-5555-5555-555555555555', 'student', 'Nadia K.', '11111111-1111-1111-1111-111111111111', 'Recomposition', 'Avancé', null);

-- ===== Programme de Lucas (Plan périodisé en JSONB) =====
insert into programs (id, coach_id, student_id, title, plan, version, status) values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'Prépa Force',
  '{
    "blocks": [
      { "id": "b1", "focus": "Hypertrophie", "weeks": [1,2,3,4], "sessions": [
        { "id": "push", "name": "Push", "exercises": [
          { "id": "e1", "name": "Développé couché", "rule": "+2,5 kg/sem", "cells": [{"v":"67,5"},{"v":"70"},{"v":"72,5"},{"v":"70","over":true}] },
          { "id": "e2", "name": "Dév. incliné hlt", "rule": "+1 kg/sem", "cells": [{"v":"24"},{"v":"25"},{"v":"26"},{"v":"24","over":true}] },
          { "id": "e3", "name": "Élévations lat.", "rule": "RPE 8", "cells": [{"v":"10"},{"v":"10"},{"v":"12","over":true},{"v":"10"}] }
        ]},
        { "id": "pull", "name": "Pull", "exercises": [
          { "id": "e4", "name": "Tractions lestées", "rule": "+1 rep/sem", "flag": "coude", "cells": [{"v":"+5"},{"v":"+5"},{"v":"+7,5","over":true},{"v":"+5"}] },
          { "id": "e5", "name": "Rowing barre", "rule": "+2,5 kg/sem", "cells": [{"v":"60"},{"v":"62,5"},{"v":"65"},{"v":"60","over":true}] }
        ]},
        { "id": "legs", "name": "Legs", "exercises": [
          { "id": "e6", "name": "Squat", "rule": "+2,5 kg/sem", "cells": [{"v":"90"},{"v":"92,5"},{"v":"95"},{"v":"90","over":true}] }
        ]}
      ]},
      { "id": "b2", "focus": "Force", "weeks": [5,6,7,8], "sessions": [
        { "id": "upper", "name": "Upper", "exercises": [ {"id":"e7","name":"Développé couché","rule":"+2,5 kg/sem","cells":[{"v":"75"},{"v":"77,5"},{"v":"80"},{"v":"77,5","over":true}]} ]},
        { "id": "lower", "name": "Lower", "exercises": [ {"id":"e8","name":"Squat","rule":"+5 kg/sem","cells":[{"v":"100"},{"v":"105"},{"v":"110"},{"v":"105","over":true}]} ]}
      ]},
      { "id": "b3", "focus": "Peak", "weeks": [9,10], "sessions": [
        { "id": "full", "name": "Full body", "exercises": [ {"id":"e9","name":"Squat","rule":"taper","cells":[{"v":"95"},{"v":"85"}]} ]}
      ]}
    ]
  }'::jsonb,
  3, 'active'
);

-- annotation élève (douleur coude, ancrée sur le développé couché)
insert into program_annotations (program_id, anchor, author, body, status) values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '{"sessionId":"push","exerciseId":"e1"}'::jsonb,
  'student', 'Douleur au coude droit sur les dernières séries, surtout en descente.', 'sent'
);

-- ===== Journal de Lucas =====
insert into journal_entries (student_id, session_ref, exercise, load, reps, rpe, note) values
  ('22222222-2222-2222-2222-222222222222', 'pull1', 'Tractions lestées', 5,  8, 9, 'douleur coude'),
  ('22222222-2222-2222-2222-222222222222', 'push1', 'Développé couché', 67.5, 8, 8, null),
  ('22222222-2222-2222-2222-222222222222', 'legs1', 'Squat', 90, 5, 8, null);

-- ===== Health scores =====
insert into health_scores (student_id, score, factors) values
  ('22222222-2222-2222-2222-222222222222', 74, '{"attendance":82,"adherence":64,"responsiveness":90,"progression":58}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 38, '{"attendance":30,"adherence":40,"responsiveness":55,"progression":28}'::jsonb),
  ('44444444-4444-4444-4444-444444444444', 54, '{"attendance":60,"adherence":45,"responsiveness":70,"progression":50}'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 61, '{"attendance":75,"adherence":68,"responsiveness":62,"progression":45}'::jsonb);

-- ===== Abonnements (gating) =====
insert into subscriptions (student_id, coach_id, status) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'active'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'past_due'),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'active'),
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'active');

-- ===== Cours collectifs =====
insert into classes (coach_id, title, capacity, level, pricing, price, starts_at) values
  ('11111111-1111-1111-1111-111111111111', 'HIIT collectif', 10, 'Tous niveaux', 'included', null, now() + interval '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'Atelier squat',   6, 'Intermédiaire', 'paid', 15, now() + interval '3 day');

-- ===== Séance ouverte (opt-in, hôte = Lucas) =====
insert into open_sessions (host_student_id, coach_id, host_name, title, level, slots, is_open, starts_at) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Lucas M.', 'Jambes · gros volume', 'Intermédiaire', 2, true, now() + interval '2 day');

drop function seed_auth_user(uuid, text, text);
