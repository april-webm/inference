import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Inference',
  description: 'Three problems. Three weeks.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-[#0a0a0a] text-zinc-100 antialiased min-h-screen flex flex-col">
        <Analytics />
        <SpeedInsights />
        <div className="flex-1">{children}</div>
        <footer className="max-w-4xl mx-auto px-6 py-6 text-xs text-zinc-600 flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span>Built by April.</span>
            <a
              href="https://ko-fi.com/aprilwebm"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors underline-offset-4 hover:underline"
            >
              <strong>Support</strong> <span aria-hidden="true">♥</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-zinc-400 transition-colors">Terms</a>
          </div>
        </footer>
      </body>
    </html>
  )
}
