-- Seed: insert the three rounds
-- Run this in Supabase SQL Editor after schema.sql

insert into public.rounds
  (number, title, tagline, description, difficulty, opens_at, closes_at, is_active)
values
(
  1,
  'The Winner''s Curse',
  'Bid smart, or bid last.',
  E'## The Setup\n\nA resource with unknown true value **V** is up for auction...\n\n*(Full problem statement will replace this placeholder before launch.)*',
  'chill',
  now(),
  now() + interval '30 days',
  true
),
(
  2,
  'The Correlated Kelly',
  'When bets move together, naive sizing will ruin you.',
  E'## Coming Soon\n\nRound 2 opens after Round 1 closes.',
  'medium',
  now() + interval '31 days',
  now() + interval '61 days',
  false
),
(
  3,
  'The Bayesian Market Maker',
  'Post a quote. Get picked off. Learn why.',
  E'## Coming Soon\n\nRound 3 opens after Round 2 closes.',
  'hard',
  now() + interval '62 days',
  now() + interval '92 days',
  false
);
