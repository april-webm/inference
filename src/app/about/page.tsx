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
            <li>One submission counts per round per person. You can update it as many times as you like (up to 5 changes per UTC day) before the round closes. The last version is the one we score.</li>
            <li>Submissions need an answer in the format the problem asks for and at least 50 characters of reasoning.</li>
            <li>Anyone can enter. If you sign up with a verified university email (.edu, .edu.au, .ac.uk, .ac.nz) you get a 🎓 next to your name on the leaderboard. That is the entire effect.</li>
            <li>Talking about the problem with friends is fine. Submitting someone else&apos;s reasoning as your own is not.</li>
            <li>Use whatever tools you want. Pen and paper, a spreadsheet, Python, an LLM. The competition is the thinking, not the manual arithmetic.</li>
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
              Reasoning is not directly scored, but is used to break ties and
              spot dodgy submissions.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-zinc-100">When do answers and rankings get released?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              After the round closes. The full answer key and an explanation
              get posted on the round&apos;s page. Final rankings appear on the
              leaderboard at the same time.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-zinc-100">Can I use an LLM?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Yes. We assume people will. Problems are written so that pasting
              the question into a chatbot will not give you the answer without
              you doing real thinking on top.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-zinc-100">Is there a prize?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Bragging rights, a spot on the leaderboard, and the chance to
              find out you&apos;re wrong about something you were sure of.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-zinc-100">What happens to my data?</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Your email is used for sign-in and the verification link, never
              shared. Your display name and scores appear publicly on the
              leaderboard for closed rounds. Your written reasoning is private
              to you and to whoever is scoring.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-medium text-zinc-100">I think the problem statement has a mistake.</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Email{' '}
              <a href="mailto:hello@inferenc.me" className="text-amber-400 hover:text-amber-300">
                hello@inferenc.me
              </a>
              . If it is a real error we will fix it and post a notice on the round page.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
