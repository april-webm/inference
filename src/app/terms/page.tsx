import { PublicNav } from '@/components/PublicNav'

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
        <h1 className="text-2xl font-medium text-zinc-100">Terms of Use</h1>
        <p className="text-xs text-zinc-600">Last updated: 1 May 2026</p>

        <div className="flex flex-col gap-4 text-sm text-zinc-300 leading-relaxed">
          <p>
            Inference is a free, online quantitative competition run
            by April Kidd. By
            creating an account and participating, you agree to the
            following.
          </p>

          <h2 className="text-base font-medium text-zinc-100 mt-2">Accounts</h2>
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <li>One account per person.</li>
            <li>You must use a valid email address.</li>
            <li>Your display name must not be offensive. We reserve the
                right to hide or rename accounts that violate this.</li>
          </ul>

          <h2 className="text-base font-medium text-zinc-100 mt-2">Competition rules</h2>
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <li>You get three submission attempts per round. Your latest
                submission is the one scored.</li>
            <li>Discussing problems with others is fine. Submitting
                identical answers and reasoning as another participant is
                not.</li>
            <li>Using LLMs is allowed but discouraged. The point is to
                learn.</li>
            <li>We reserve the right to disqualify submissions that
                appear to be gaming the system (e.g. automated probing
                of the grader).</li>
          </ul>

          <h2 className="text-base font-medium text-zinc-100 mt-2">Scoring and leaderboard</h2>
          <ul className="list-disc pl-5 flex flex-col gap-2">
            <li>Scoring is final once posted. We may re-score if a
                grader bug is found, but this is at our discretion.</li>
            <li>Your display name and scores appear publicly on the
                leaderboard.</li>
            <li>There are no prizes unless explicitly announced for a
                specific season.</li>
          </ul>

          <h2 className="text-base font-medium text-zinc-100 mt-2">Liability</h2>
          <p>
            Inference is provided as-is. We don&apos;t guarantee uptime,
            score accuracy, or anything else. This is a free competition
            for fun and learning.
          </p>

          <h2 className="text-base font-medium text-zinc-100 mt-2">Changes</h2>
          <p>
            We may update these terms. Continued use of the site after
            changes constitutes acceptance.
          </p>

          <h2 className="text-base font-medium text-zinc-100 mt-2">Contact</h2>
          <p>
            Questions? Email{' '}
            <a href="mailto:hello@inferenc.me" className="text-amber-400 hover:text-amber-300">
              hello@inferenc.me
            </a>.
          </p>
        </div>
      </main>
    </div>
  )
}
