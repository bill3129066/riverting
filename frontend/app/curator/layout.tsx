'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function CuratorLayout({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Wallet Required</h1>
          <p className="text-[#666] mb-8">
            Connect your wallet to access the Curator Dashboard.
          </p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
