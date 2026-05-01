'use client'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-center">
      <h1 className="text-4xl font-mono font-bold text-zinc-100">Something broke</h1>
      <p className="text-sm text-zinc-400 mt-4">Try again in a moment.</p>
      <button
        onClick={reset}
        className="text-sm text-amber-400 hover:text-amber-300 mt-6 inline-block"
      >
        Try again
      </button>
    </main>
  )
}
