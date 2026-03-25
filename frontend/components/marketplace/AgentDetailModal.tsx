'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { PLATFORM_FEE, formatRate } from '@/lib/utils'
import { createSession } from '@/lib/api'

export default function AgentDetailModal({ agent, onClose }: { agent: any; onClose: () => void }) {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const totalRate = agent.curator_rate_per_second + PLATFORM_FEE

  // TODO: Add SIWE verification for production
  // TODO: Add USDC balance check for production
  async function handleStartSession() {
    setLoading(true)
    setError(null)
    try {
      const { sessionId } = await createSession(agent.id, address!, agent.curator_rate_per_second)
      router.push(`/session/${sessionId}`)
    } catch (e: any) {
      setError(e.message || 'Failed to start session')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-surface-elevated p-12 max-w-2xl w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className="bg-surface-dim px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-text-tertiary mb-4 inline-block">
              {agent.category}
            </span>
            <h2 className="font-display font-bold text-3xl text-text-primary">{agent.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-text-tertiary hover:text-text-primary text-3xl leading-none font-light" aria-label="Close modal">&times;</button>
        </div>

        <p className="text-text-secondary mb-12 text-lg leading-relaxed">{agent.description}</p>

        <div className="mb-12 border-t border-border-subtle">
          <div className="flex justify-between text-sm py-4 border-b border-border-subtle">
            <span className="text-text-tertiary uppercase tracking-widest text-xs">Curator rate</span>
            <span className="font-sans text-text-secondary">{formatRate(agent.curator_rate_per_second)}</span>
          </div>
          <div className="flex justify-between text-sm py-4 border-b border-border-subtle">
            <span className="text-text-tertiary uppercase tracking-widest text-xs">Platform fee</span>
            <span className="font-sans text-text-secondary">{formatRate(PLATFORM_FEE)}</span>
          </div>
          <div className="flex justify-between py-4 border-b border-border-strong">
            <span className="text-accent font-bold uppercase tracking-widest text-xs flex items-center">You pay</span>
            <span className="text-accent font-bold text-xl">{formatRate(totalRate)}</span>
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-widest text-text-tertiary mb-8">
          Curator Wallet: <span className="font-mono">{agent.curator_wallet}</span>
        </p>

        {error && <p className="text-error text-sm mb-4 bg-error/10 p-3 border border-error/20">{error}</p>}

        {!isConnected ? (
          <button
            type="button"
            onClick={() => openConnectModal?.()}
            className="w-full bg-text-primary text-surface font-bold py-4 uppercase tracking-widest text-sm hover:bg-accent transition-colors"
          >
            Connect Wallet to Start
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartSession}
            disabled={loading}
            className="w-full bg-text-primary text-surface font-bold py-4 uppercase tracking-widest text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting\u2026' : 'Start Session \u2192'}
          </button>
        )}
      </div>
    </div>
  )
}
