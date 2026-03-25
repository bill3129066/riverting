'use client'

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function CuratorLayout({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-display font-bold mb-4 text-text-primary">Wallet Required</h1>
          <p className="text-text-secondary mb-8">
            Connect your wallet to access the Curator Dashboard.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
