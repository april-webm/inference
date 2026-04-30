-- Seed: insert the three rounds.
-- Run this in Supabase SQL Editor after schema.sql.
-- All times are UTC.
--
-- Notes:
--   * is_active=true for round 1 means "this is the featured round on the
--     dashboard". The dashboard will still hide the description until
--     opens_at has passed (preview state).
--   * Rounds 2 and 3 are upcoming and will not appear on the dashboard
--     until they are opened. Listed on the public /rounds page as upcoming.

insert into public.rounds
  (number, title, tagline, description, difficulty, opens_at, closes_at, is_active)
values
(
  1,
  'The Winner''s Curse',
  'Bid smart, or bid last.',
  E'## Coming Soon\n\nThe full problem statement will appear here when the round opens.',
  'chill',
  '2026-05-01 10:00:00+00',
  '2026-05-31 23:59:59+00',
  true
),
(
  2,
  'The Correlated Kelly',
  'When bets move together, naive sizing will ruin you.',
  E'## Coming Soon\n\nRound 2 opens 1 June 2026 at 10:00 UTC.',
  'medium',
  '2026-06-01 10:00:00+00',
  '2026-06-30 23:59:59+00',
  false
),
(
  3,
  'The Bayesian Market Maker',
  'Post a quote. Get picked off. Learn why.',
  E'## Coming Soon\n\nRound 3 opens 1 July 2026 at 10:00 UTC.',
  'hard',
  '2026-07-01 10:00:00+00',
  '2026-07-31 23:59:59+00',
  false
);
