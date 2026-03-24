'use client'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { fetchAgents } from '@/lib/api'

const PLATFORM_FEE = 300

export default function CuratorPage() {
  const { address } = useAccount()
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgents()
      .then(all => setAgents(all.filter((a: any) =>
        !address || a.curator_wallet.toLowerCase() === address.toLowerCase()
      )))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  const totalEarned = 0 // Will be populated from settlement service

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Curator Dashboard</h1>
            <p className="text-[#666] text-sm mt-1">
              {address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Connect wallet to see your agents'}
            </p>
          </div>
          <Link
            href="/curator/agents/new"
            className="bg-[#00d4aa] text-black font-bold px-5 py-2.5 rounded-xl hover:bg-[#00b894] transition-colors"
          >
            + Upload Agent
          </Link>
        </div>

        {/* Earnings summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
            <p className="text-[#666] text-xs uppercase tracking-wide mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-[#00d4aa]">${totalEarned.toFixed(4)}</p>
          </div>
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
            <p className="text-[#666] text-xs uppercase tracking-wide mb-1">Active Agents</p>
            <p className="text-2xl font-bold">{agents.filter(a => a.active).length}</p>
          </div>
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
            <p className="text-[#666] text-xs uppercase tracking-wide mb-1">Pending Payout</p>
            <p className="text-2xl font-bold">$0.0000</p>
          </div>
        </div>

        {/* Agent list */}
        <h2 className="text-xl font-semibold mb-4">My Agents</h2>
        {loading ? (
          <p className="text-[#666]">Loading...</p>
        ) : agents.length === 0 ? (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-8 text-center">
            <p className="text-[#666] mb-4">No agents yet</p>
            <Link href="/curator/agents/new" className="text-[#00d4aa] hover:underline">
              Upload your first agent →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map(agent => (
              <div key={agent.id} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="text-[#666] text-sm">{agent.category} · ${(agent.curator_rate_per_second / 1_000_000).toFixed(4)}/sec</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${agent.active ? 'bg-[#00d4aa]/10 text-[#00d4aa]' : 'bg-[#333] text-[#666]'}`}>
                    {agent.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-[#666] text-sm">$0.0000 earned</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}