# Inference

Frontend for [inferenc.me](https://inferenc.me) — a quantitative competition where you analyse data and submit estimates.

Built with Next.js 16, Supabase, and Tailwind. Deployed on Vercel.

## Development

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase keys
npm run dev                        # http://localhost:3000
```

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

Get these from your Supabase project → Settings → API.

## Structure

```
src/
├── app/
│   ├── page.tsx                    Landing page
│   ├── about/                      About + FAQ + scoring explanation
│   ├── seasons/[season]/[round]/   Round detail + inline submission
│   ├── dashboard/                  Profile hub (auth required)
│   ├── dashboard/settings/         Account settings
│   ├── leaderboard/                Season leaderboard with search
│   ├── profile/[id]/               Public profile page
│   ├── auth/                       Login, signup, password reset
│   ├── api/submit/                 Submission endpoint
│   ├── api/signup/                 Registration endpoint
│   ├── api/data/                   Gated data file downloads
│   ├── privacy/                    Privacy policy
│   └── terms/                      Terms of use
├── components/                     Shared UI components
├── lib/
│   ├── supabase/                   Supabase client setup
│   ├── email.ts                    Email domain allowlist
│   └── moderation.ts               Display name validation
├── types/database.ts               TypeScript interfaces
└── middleware.ts                    API rate limiting
```

## Key decisions

- **Round data** served from Supabase Storage via `/api/data/` route, gated by `opens_at` timestamp. Not stored in git.
- **Submissions** validated per-round at the API level (checks JSON schema matches expected format).
- **Scoring** happens in the private [inference-scoring](https://github.com/april-webm/inference-scoring) repo.
- **Leaderboard** is a Postgres view — updates instantly when scores are written.

## Issues

[github.com/april-webm/inference/issues](https://github.com/april-webm/inference/issues)
