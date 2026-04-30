-- Seed: insert the three rounds
-- Run this in Supabase SQL Editor after schema.sql
-- All times are UTC.

insert into public.rounds
  (number, title, tagline, description, difficulty, opens_at, closes_at, is_active)
values
(
  1,
  'The Winner''s Curse',
  'Bid smart, or bid last.',
  E'## The Setup\n\nA resource with unknown true value **V** is up for sealed-bid auction. Each bidder receives an independent noisy signal of V and submits one bid. The highest bid wins and pays its bid; everyone else pays nothing.\n\n*(Full problem statement will replace this placeholder before launch.)*\n\n## Submission format\n\n```json\n{ "bid": 142.50 }\n```\n\n## Reasoning\n\nExplain how you arrived at your bid. Aim for clear logic over length.',
  'chill',
  '2026-05-01 10:00:00+00',
  '2026-05-31 23:59:59+00',
  true
),
(
  2,
  'The Correlated Kelly',
  'When bets move together, naive sizing will ruin you.',
  E'## Coming Soon\n\nRound 2 opens 1 June 2026 at 10:00 UTC, after Round 1 closes.',
  'medium',
  '2026-06-01 10:00:00+00',
  '2026-06-30 23:59:59+00',
  false
),
(
  3,
  'The Bayesian Market Maker',
  'Post a quote. Get picked off. Learn why.',
  E'## Coming Soon\n\nRound 3 opens 1 July 2026 at 10:00 UTC, after Round 2 closes.',
  'hard',
  '2026-07-01 10:00:00+00',
  '2026-07-31 23:59:59+00',
  false
);
