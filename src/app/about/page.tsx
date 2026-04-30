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
            Inference is a small monthly competition for people who like
            thinking carefully about uncertainty. Three problems, three months,
            no code required. Each round we put up a question pulled from the
            kind of reasoning that shows up in trading, gambling, and
            statistics. You read the problem, work out an answer, write a
            short explanation, and submit. Once the round closes we score
            everyone and post a leaderboard.
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

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-zinc-100">How is scoring done?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Each problem has its own scoring rule, posted with the problem
              statement. Most rounds score on closeness to a correct answer
              under the model the problem describes. Higher score is better.
              Scoring is centralised. Reasoning is not directly scored, but it
              gets read and is used to spot dodgy submissions.
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
      </main>
    </div>
  )
}
