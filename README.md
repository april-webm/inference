# Inference

[![Deploy](https://img.shields.io/badge/deploy-Vercel-black)](https://inferenc.me)
[![License](https://img.shields.io/badge/license-MIT-blue)]()

Frontend for [inferenc.me](https://inferenc.me) — a quantitative competition where you analyse data and submit estimates. Three problems, three weeks, no code required.

**Stack:** Next.js 16 · Supabase · Tailwind · Vercel

**Status:** Season 0 live.

---

## Getting started

```bash
npm install
cp .env.local.example .env.local   # see below
npm run dev                        # http://localhost:3000
```

### Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>    # optional for local dev
```

The anon key is public — safe to share, only allows what RLS policies permit. The service role key bypasses RLS and must never be committed. Pages render fine without it; only API routes that write data need it.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                    Landing page
│   ├── about/                      About, FAQ, scoring explanation
│   ├── seasons/[season]/[round]/   Round detail + inline submission
│   ├── dashboard/                  Profile hub (auth required)
│   │   └── settings/              Change name, email, password
│   ├── leaderboard/                Season leaderboard with search
│   ├── profile/[id]/               Public profile with badges
│   ├── auth/                       Login, signup, password reset
│   ├── api/
│   │   ├── submit/                Submission endpoint (validates per-round)
│   │   ├── signup/                Registration with email domain check
│   │   └── data/                  Gated data file downloads from Supabase Storage
│   ├── privacy/                    Privacy policy
│   └── terms/                      Terms of use
├── components/                     Shared UI (Countdown, Badge, etc.)
├── lib/
│   ├── supabase/                   Client setup (server + browser)
│   ├── email.ts                    Email domain allowlist
│   └── moderation.ts               Display name validation
├── types/database.ts               TypeScript interfaces
└── middleware.ts                    API rate limiting (30 req/min/IP)
```

---

## How it works

- **Round data** served from Supabase Storage via `/api/data/`, gated by `opens_at`. Not stored in git.
- **Submissions** validated per-round at the API level before storing.
- **Scoring** happens in the private [inference-scoring](https://github.com/april-webm/inference-scoring) repo after each round closes.
- **Leaderboard** is a Postgres view — updates instantly when scores are written.
- **Normalisation** — `points = 1000 × raw_score / best_raw_score`. Negative scores possible.

---

## Related

- **[inference-scoring](https://github.com/april-webm/inference-scoring)** (private) — graders, solutions, data generation, scoring scripts
- **[inferenc.me](https://inferenc.me)** — live site

## Issues

[github.com/april-webm/inference/issues](https://github.com/april-webm/inference/issues)
