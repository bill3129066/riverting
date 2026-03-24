import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import { NavBar } from '@/components/NavBar'

const Providers = dynamic(
  () => import('./providers').then(mod => ({ default: mod.Providers })),
  { ssr: false }
)

const inter = Inter({ subsets: ['latin'] })

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
      <body className={`${inter.className} min-h-screen bg-background text-text`} suppressHydrationWarning>
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
