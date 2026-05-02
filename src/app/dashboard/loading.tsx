export default function Loading() {
  return (
    <div className="flex flex-col gap-10 animate-pulse">
      <div className="flex items-start gap-6">
        <div className="w-16 h-16 rounded-full bg-zinc-800" />
        <div className="flex flex-col gap-2">
          <div className="h-6 bg-zinc-800 rounded w-36" />
          <div className="h-3 bg-zinc-800 rounded w-20" />
        </div>
      </div>
      <div className="h-px bg-zinc-800" />
      <div className="flex flex-col gap-3">
        <div className="h-4 bg-zinc-800 rounded w-32" />
        <div className="h-20 bg-zinc-800 rounded" />
        <div className="h-20 bg-zinc-800 rounded" />
        <div className="h-20 bg-zinc-800 rounded" />
      </div>
    </div>
  )
}
