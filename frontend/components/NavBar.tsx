'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectWalletButton } from './wallet/ConnectWalletButton'

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-[#222] bg-[#0a0a0a] px-8 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="text-xl font-extrabold text-[#00d4aa] tracking-tight">
            Riverting
          </Link>
          <div className="flex gap-8">
            <Link
              href="/skills"
              className={`text-sm font-medium transition-colors ${
                pathname === '/skills' || pathname?.startsWith('/skills/') ? 'text-[#00d4aa]' : 'text-[#888] hover:text-white'
              }`}
            >
              Skills
            </Link>
            <Link
              href="/upload"
              className={`text-sm font-medium transition-colors ${
                pathname === '/upload' ? 'text-[#00d4aa]' : 'text-[#888] hover:text-white'
              }`}
            >
              Upload
            </Link>
            <Link
              href="/marketplace"
              className={`text-sm font-medium transition-colors ${
                pathname === '/marketplace' ? 'text-[#00d4aa]' : 'text-[#888] hover:text-white'
              }`}
            >
              Agents
            </Link>
            <Link
              href="/sessions"
              className={`text-sm font-medium transition-colors ${
                pathname?.startsWith('/sessions') ? 'text-[#00d4aa]' : 'text-[#888] hover:text-white'
              }`}
            >
              Sessions
            </Link>
            <Link
              href="/curator"
              className={`text-sm font-medium transition-colors ${
                pathname?.startsWith('/curator') ? 'text-[#00d4aa]' : 'text-[#888] hover:text-white'
              }`}
            >
              Curator
            </Link>
          </div>
        </div>
        <ConnectWalletButton />
      </div>
    </nav>
  )
}
