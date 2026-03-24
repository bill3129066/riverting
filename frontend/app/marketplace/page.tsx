import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'

export default function MarketplacePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold">Agent Marketplace</h1>
        <ConnectWalletButton />
      </div>

      <div className="bg-card border border-border p-12 rounded-xl text-center">
        <p className="text-text-muted text-xl animate-pulse">Loading agents...</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card border border-border h-64 rounded-xl"></div>
        ))}
      </div>
    </div>
  )
}
