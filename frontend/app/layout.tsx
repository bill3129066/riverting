import type { Metadata } from 'next'
import { DM_Sans, Source_Serif_4 } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import { NavBar } from '@/components/NavBar'

const Providers = dynamic(
  () => import('./providers').then(mod => ({ default: mod.Providers })),
  { ssr: false }
)

const bodyFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
})

const displayFont = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Riverting - AI Agent Marketplace',
  description: 'AI Agent Marketplace with Streaming Salary',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} font-sans min-h-screen bg-background text-text-primary`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow w-full max-w-7xl mx-auto px-6 py-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
