import { PublicNav } from '@/components/PublicNav'

export default function Loading() {
  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6 animate-pulse">
        <div className="h-3 bg-zinc-800 rounded w-16" />
        <div className="flex flex-col gap-2">
          <div className="h-3 bg-zinc-800 rounded w-32" />
          <div className="h-7 bg-zinc-800 rounded w-48" />
          <div className="h-4 bg-zinc-800 rounded w-64" />
          <div className="flex gap-2 mt-1">
            <div className="h-5 bg-zinc-800 rounded w-14" />
            <div className="h-5 bg-zinc-800 rounded w-14" />
            <div className="h-5 bg-zinc-800 rounded w-32" />
          </div>
        </div>
        <div className="h-px bg-zinc-800" />
        <div className="flex flex-col gap-3">
          <div className="h-4 bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-800 rounded w-5/6" />
          <div className="h-4 bg-zinc-800 rounded w-4/6" />
          <div className="h-4 bg-zinc-800 rounded w-full" />
          <div className="h-4 bg-zinc-800 rounded w-3/4" />
        </div>
      </main>
    </div>
  )
}
