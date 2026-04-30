-- ============================================================
-- Inference Competition Platform — Supabase Schema
-- ============================================================

create extension if not exists "uuid-ossp";

-- Profiles
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text not null,
  university_email  boolean not null default false,
  created_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, university_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Anonymous'),
    (
      new.email ilike '%.edu.au'
      or new.email ilike '%.edu'
      or new.email ilike '%.ac.uk'
      or new.email ilike '%.ac.nz'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Rounds
create table public.rounds (
  id          uuid primary key default uuid_generate_v4(),
  number      int not null unique,
  title       text not null,
  tagline     text not null,
  description text not null,
  difficulty  text not null check (difficulty in ('chill', 'medium', 'hard')),
  opens_at    timestamptz not null,
  closes_at   timestamptz not null,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.rounds enable row level security;

create policy "Rounds are publicly readable"
  on public.rounds for select using (true);

-- Submissions
create table public.submissions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  round_id     uuid not null references public.rounds(id) on delete cascade,
  answer       jsonb not null,
  reasoning    text not null,
  submitted_at timestamptz not null default now(),
  unique (user_id, round_id),
  constraint reasoning_min_length check (char_length(reasoning) >= 50)
);

alter table public.submissions enable row level security;

create policy "Users can read own submissions"
  on public.submissions for select using (auth.uid() = user_id);

create policy "Users can insert own submissions"
  on public.submissions for insert with check (auth.uid() = user_id);

create policy "Users can update own submissions"
  on public.submissions for update using (auth.uid() = user_id);

-- Submission attempts (rate limiting)
create table public.submission_attempts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  round_id     uuid not null references public.rounds(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

alter table public.submission_attempts enable row level security;

create policy "Users can read own attempts"
  on public.submission_attempts for select using (auth.uid() = user_id);

create policy "Users can insert own attempts"
  on public.submission_attempts for insert with check (auth.uid() = user_id);

-- Scores
create table public.scores (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  round_id    uuid not null references public.rounds(id) on delete cascade,
  score       numeric not null,
  rank        int not null,
  computed_at timestamptz not null default now(),
  unique (user_id, round_id)
);

alter table public.scores enable row level security;

create policy "Scores are publicly readable"
  on public.scores for select using (true);

-- Leaderboard view
create or replace view public.leaderboard as
  select
    sc.round_id,
    r.number      as round_number,
    r.title       as round_title,
    r.difficulty,
    sc.rank,
    sc.score,
    p.display_name,
    p.university_email,
    sc.computed_at
  from public.scores sc
  join public.profiles p on p.id = sc.user_id
  join public.rounds r   on r.id = sc.round_id
  order by r.number desc, sc.rank asc;
