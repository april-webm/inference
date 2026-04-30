export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <a href="/" className="block text-center font-mono text-xl font-bold text-amber-400 mb-8 tracking-tight">
          Inference
        </a>
        {children}
      </div>
    </div>
  )
}
