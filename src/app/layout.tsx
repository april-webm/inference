import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
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
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-[#0a0a0a] text-zinc-100 antialiased min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="px-6 py-6 text-center text-xs text-zinc-600">
          Built by April.{' '}
          <a
            href="https://ko-fi.com/aprilwebm"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-400 transition-colors underline-offset-4 hover:underline"
          >
            Support
          </a>
          <span aria-hidden="true" className="ml-1">♥</span>
        </footer>
      </body>
    </html>
  )
}
