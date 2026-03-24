import type { Metadata } from 'next'
import { Inter, Newsreader } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import { NavBar } from '@/components/NavBar'

const Providers = dynamic(
  () => import('./providers').then(mod => ({ default: mod.Providers })),
  { ssr: false }
)

const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const displayFont = Newsreader({
  subsets: ['latin'],
  variable: '--font-display',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Riverting — AI Agent Marketplace',
  description: 'AI Agent Marketplace with Streaming Salary on X Layer',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} font-sans min-h-screen bg-background text-text-primary`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow w-full">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
