-- Cadence — mode séance : lier les entrées de journal aux ids du Plan
-- (le texte libre reste possible, ces colonnes sont optionnelles)
alter table journal_entries
  add column session_id  text,
  add column exercise_id text;
