import Link from 'next/link'
import { ConnectWalletButton } from './wallet/ConnectWalletButton'

export function NavBar() {
  return (
    <nav className="border-b border-border bg-background px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-primary">
            Riverting
          </Link>
          <div className="flex gap-4">
            <Link href="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">
              Browse Agents
            </Link>
            <Link href="/curator" className="text-sm font-medium hover:text-primary transition-colors">
              Upload Agent
            </Link>
          </div>
        </div>
        <ConnectWalletButton />
      </div>
    </nav>
  )
}
