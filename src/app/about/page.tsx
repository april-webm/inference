import { PublicNav } from '@/components/PublicNav'

export const dynamic = 'force-dynamic'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-10">
        <section className="flex flex-col gap-3">
          <h1 className="text-2xl font-medium text-zinc-100">About Inference</h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Inference is a short competition for people who like thinking
            carefully about uncertainty. Three problems, three weeks, no code
            required. Each round we put up a question pulled from the kind of
            reasoning that shows up in trading, gambling, and statistics. You
            read the problem, work out an answer, write a short explanation,
            and submit. Once the round closes we score everyone and post a
            leaderboard.
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            The whole thing runs on the honour system. Submit what you reckon
            is right, show your working, and try to learn something.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-zinc-100">Rules</h2>
          <ul className="text-sm text-zinc-300 leading-relaxed list-disc pl-5 flex flex-col gap-2">
            <li>
              <strong className="text-zinc-100">Three submissions per round, total.</strong>
              {' '}You can update your answer up to three times before the round closes.
              The latest one is the one we score. Use them wisely.
            </li>
            <li>Submissions need an answer in the format the problem asks for and at least 50 characters of reasoning.</li>
            <li>Talking through a problem with friends is fine. Submitting the same answer and reasoning as someone else is not.</li>
            <li>Using an LLM is allowed but discouraged. The point of this is to learn something, and the way you learn is by working through it yourself.</li>
            <li>Ties are broken by earliest submission. If you and someone else end up on the same score, whoever locked it in first ranks higher.</li>
            <li>Be civil. Display names that are abusive will be hidden from the leaderboard.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-zinc-100">FAQ</h2>

          <div id="scoring" className="flex flex-col gap-1 scroll-mt-6">
            <h3 className="text-sm font-medium text-zinc-100">How is scoring done?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Each round has its own grading rule, described in the problem
              statement. Your submission is simulated and scored on raw
              performance (profit, PnL, or whatever the round measures).
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed mt-2">
              Raw scores are then <strong className="text-zinc-300">normalised to a 0–1000 point
              scale</strong>. The best raw score in each round maps to 1000 points,
              and everyone else gets points proportional to their raw score.
              Negative raw scores are floored to 0 points (you can&apos;t lose
              season points, just miss out). This keeps each round equally
              weighted while preserving the gap between performances.
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed mt-2">
              Your season score is the sum of your normalised scores across
              all rounds (max 3000). The season leaderboard ranks by this total.
              Per-round raw scores are also shown for reference.
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed mt-2">
              Reasoning is not directly scored, but it gets read and is used
              to spot dodgy submissions.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-zinc-100">When do rounds open and close?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Each round opens at 10:00 AM GMT and closes at midnight GMT
              seven days later. Rounds run back-to-back, one per week.
              A countdown timer on each round page shows exactly how long
              you have left.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-zinc-100">When are answers and rankings released?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              After the round closes. The full answer key and a write-up
              go on the round&apos;s page. Final rankings appear on the
              leaderboard at the same time.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-zinc-100">Can I use an LLM?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              You can, but try not to. This is meant as a learning exercise.
              Most of the value is in working through the problem yourself,
              getting it wrong, and working out why.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-zinc-100">Is there a prize?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Bragging rights and a spot on the leaderboard, for now. As the
              comp grows the plan is to bring on sponsors and offer real
              prizes for top finishers.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-zinc-100">What happens to my data?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Your email is used for sign-in and the verification link, and
              never shared. Your display name and scores appear publicly on
              the leaderboard for closed rounds. Your written reasoning is
              private to you and to whoever is scoring.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-zinc-100">Issues</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Found a bug or have a question? Open an issue on{' '}
            <a
              href="https://github.com/april-webm/inference/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300"
            >
              GitHub
            </a>.
          </p>
        </section>
      </main>
    </div>
  )
}
