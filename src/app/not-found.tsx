import { PublicNav } from '@/components/PublicNav'

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-mono font-bold text-zinc-100">404</h1>
        <p className="text-sm text-zinc-400 mt-4">Page not found.</p>
        <a href="/" className="text-sm text-amber-400 hover:text-amber-300 mt-6 inline-block">
          Back to home
        </a>
      </main>
    </div>
  )
}
