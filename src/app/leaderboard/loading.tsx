import { PublicNav } from '@/components/PublicNav'

export default function Loading() {
  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6 animate-pulse">
        <div className="h-7 bg-zinc-800 rounded w-36" />
        <div className="flex gap-2">
          <div className="h-6 bg-zinc-800 rounded w-20" />
          <div className="h-6 bg-zinc-800 rounded w-20" />
          <div className="h-6 bg-zinc-800 rounded w-20" />
        </div>
        <div className="h-64 bg-zinc-800 rounded" />
      </main>
    </div>
  )
}
