'use client'
import { useRouter } from 'next/navigation'

const PLATFORM_FEE = 300

function formatRate(units: number): string {
  return `$${(units / 1_000_000).toFixed(4)}/sec`
}

export default function AgentDetailModal({ agent, onClose }: { agent: any; onClose: () => void }) {
  const router = useRouter()
  const totalRate = agent.curator_rate_per_second + PLATFORM_FEE

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
        
        <button
          onClick={() => router.push(`/session/new?agentId=${agent.id}`)}
          className="w-full bg-[#00d4aa] text-black font-bold py-3 rounded-xl hover:bg-[#00b894] transition-colors"
        >
          Start Session →
        </button>
      </div>
    </div>
  )
}
