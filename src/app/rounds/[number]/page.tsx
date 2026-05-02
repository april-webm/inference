import { redirect } from 'next/navigation'

export default async function RoundRedirect({
  params,
}: {
  params: Promise<{ number: string }>
}) {
  const { number } = await params
  // Legacy redirect: assume Season 0 for old round URLs
  redirect(`/seasons/0/${number}`)
}
