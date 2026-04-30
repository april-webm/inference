export default function CheckEmailPage() {
  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="text-lg font-medium text-zinc-100">Check your inbox</h1>
      <p className="text-sm text-zinc-400">
        We sent a verification link to your email address. Click it to activate your account, then log in.
      </p>
      <p className="text-xs text-zinc-500">
        <a href="/auth/login" className="text-amber-400 hover:text-amber-300">Back to login</a>
      </p>
    </div>
  )
}
