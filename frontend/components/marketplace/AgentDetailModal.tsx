'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLATFORM_FEE, formatRate } from '@/lib/utils'

export default function AgentDetailModal({ agent, onClose }: { agent: any; onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const totalRate = agent.curator_rate_per_second + PLATFORM_FEE

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const onchainId = Date.now()
      const res = await fetch(`${apiBase}/api/sessions/${onchainId}/spawn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          totalRate,
          curatorRate: agent.curator_rate_per_second,
          platformFee: PLATFORM_FEE,
        }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const { sessionId } = await res.json()
      router.push(`/session/${sessionId}`)
    } catch (e: any) {
      setError(e.message || 'Failed to start session')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-8 max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-xs bg-[#00d4aa]/10 text-[#00d4aa] px-2 py-1 rounded-full uppercase">
              {agent.category}
            </span>
            <h2 className="text-2xl font-bold mt-2">{agent.name}</h2>
          </div>
          <button onClick={onClose} className="text-[#666] hover:text-white text-2xl p-1" aria-label="Close modal">×</button>
        </div>

        <p className="text-[#aaa] mb-6">{agent.description}</p>

        <div className="bg-[#0a0a0a] rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#666]">Curator rate</span>
            <span>{formatRate(agent.curator_rate_per_second)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#666]">Platform fee</span>
            <span>{formatRate(PLATFORM_FEE)}</span>
          </div>
          <div className="flex justify-between font-bold text-[#00d4aa] border-t border-[#1a1a1a] pt-2 mt-2">
            <span>You pay</span>
            <span>{formatRate(totalRate)}</span>
          </div>
        </div>

        <p className="text-xs text-[#555] mb-4">
          Curator: {agent.curator_wallet.slice(0, 6)}...{agent.curator_wallet.slice(-4)}
        </p>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-[#00d4aa] text-black font-bold py-3 rounded-xl hover:bg-[#00b894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Starting...' : 'Start Session →'}
        </button>
      </div>
    </div>
  )
}
