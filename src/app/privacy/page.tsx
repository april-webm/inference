import { PublicNav } from '@/components/PublicNav'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
        <h1 className="text-2xl font-medium text-zinc-100">Privacy Policy</h1>
        <p className="text-xs text-zinc-600">Last updated: 1 May 2026</p>

        <div className="flex flex-col gap-4 text-sm text-zinc-300 leading-relaxed">
          <p>
            Inference is a free competition run by April Kidd. This policy
            describes what data we collect, why, and what we do with it.
          </p>

          <h2 className="text-base font-medium text-zinc-100 mt-2">What we collect</h2>
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <li>
              <strong className="text-zinc-100">Email address</strong> — used for
              sign-in, email verification, and round notifications. Never
              shared with third parties.
            </li>
            <li>
              <strong className="text-zinc-100">Display name</strong> — shown publicly
              on the leaderboard. You choose it at signup and can change it
              in settings.
            </li>
            <li>
              <strong className="text-zinc-100">Submissions</strong> — your answers
              and reasoning for each round. Visible only to you and to
              whoever is scoring. Not shared publicly.
            </li>
            <li>
              <strong className="text-zinc-100">Scores and ranks</strong> — computed
              after each round closes. Your display name, score, and rank
              appear publicly on the leaderboard.
            </li>
          </ul>

          <h2 className="text-base font-medium text-zinc-100 mt-2">How we store it</h2>
          <p>
            Data is stored in Supabase (hosted on AWS). Passwords are
            hashed by Supabase Auth. We don&apos;t store passwords ourselves.
          </p>

          <h2 className="text-base font-medium text-zinc-100 mt-2">Analytics</h2>
          <p>
            We use Vercel Analytics and Speed Insights to understand site
            usage. These collect anonymous, aggregated data (page views,
            load times). No personal data is sent to analytics.
          </p>

          <h2 className="text-base font-medium text-zinc-100 mt-2">Emails</h2>
          <p>
            We send transactional emails (verification, password reset)
            and competition notifications (round opens, scores posted)
            via Resend. You can contact us to opt out of notifications.
          </p>

          <h2 className="text-base font-medium text-zinc-100 mt-2">Deletion</h2>
          <p>
            To delete your account and all associated data, email{' '}
            <a href="mailto:hello@inferenc.me" className="text-amber-400 hover:text-amber-300">
              hello@inferenc.me
            </a>.
          </p>

          <h2 className="text-base font-medium text-zinc-100 mt-2">Contact</h2>
          <p>
            Questions about your data? Email{' '}
            <a href="mailto:hello@inferenc.me" className="text-amber-400 hover:text-amber-300">
              hello@inferenc.me
            </a>.
          </p>
        </div>
      </main>
    </div>
  )
}
