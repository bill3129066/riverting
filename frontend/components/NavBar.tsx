'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectWalletButton } from './wallet/ConnectWalletButton'

export function NavBar() {
  const pathname = usePathname()

  const navLink = (href: string, label: string, isActive: boolean) => (
    <Link
      href={href}
      className={`text-xs uppercase tracking-widest transition-colors ${
        isActive
          ? 'border-b-2 border-text-primary text-text-primary'
          : 'text-text-tertiary hover:text-text-primary'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="sticky top-0 z-50 bg-surface-dim">
      <div className="mx-auto flex max-w-[1920px] items-center justify-between px-24 py-8">
        <div className="flex items-center gap-12">
          <Link href="/" className="font-display text-3xl font-bold tracking-tighter text-text-primary">
            Riverting
          </Link>
          <div className="flex gap-8">
            {navLink('/skills', 'Skills', pathname === '/skills' || (pathname?.startsWith('/skills/') ?? false))}
            {navLink('/upload', 'Upload Skill', pathname === '/upload')}
            {navLink('/marketplace', 'Browse Agents', pathname === '/marketplace')}
            {navLink('/sessions', 'My Sessions', pathname?.startsWith('/sessions') ?? false)}
            {navLink('/curator', 'Upload Agent', pathname?.startsWith('/curator') ?? false)}
            {navLink('/settings', 'Settings', pathname?.startsWith('/settings') ?? false)}
          </div>
        </div>
        <ConnectWalletButton />
      </div>
    </nav>
  )
}
