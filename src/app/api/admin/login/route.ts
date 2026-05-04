import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminSession } from '@/lib/admin-session'

export async function POST(request: Request) {
  const { username, password } = await request.json()

  const expectedUsername = process.env.ADMIN_USERNAME
  const expectedPassword = process.env.ADMIN_PASSWORD

  if (!expectedUsername || !expectedPassword) {
    return NextResponse.json({ error: 'Admin not configured.' }, { status: 500 })
  }

  const usernameMatch =
    username.length === expectedUsername.length &&
    timingSafeEqual(Buffer.from(username), Buffer.from(expectedUsername))

  const passwordMatch =
    password.length === expectedPassword.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword))

  if (!usernameMatch || !passwordMatch) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  await createAdminSession()
  return NextResponse.json({ success: true })
}
