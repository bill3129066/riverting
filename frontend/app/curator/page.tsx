'use client'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { fetchAgents } from '@/lib/api'
import { PLATFORM_FEE } from '@/lib/utils'

export default function CuratorPage() {
  const { address } = useAccount()
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<number | null>(null)

  useEffect(() => {
    fetchAgents()
      .then(all => setAgents(all.filter((a: any) =>
        !address || a.curator_wallet.toLowerCase() === address.toLowerCase()
      )))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  async function handleRemove(agentId: number) {
    if (!address || !confirm('Remove this agent? This cannot be undone.')) return
    setRemoving(agentId)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiBase}/api/agents/${agentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curatorWallet: address }),
      })
      if (!res.ok) throw new Error('Failed to remove agent')
      setAgents(prev => prev.filter(a => a.id !== agentId))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setRemoving(null)
    }
  }

  const totalEarned = 0

  return (
    <div className="bg-background min-h-screen text-text-primary">
      <div className="max-w-[1920px] mx-auto px-24 pt-24 pb-32">
        <div className="flex justify-between items-end mb-24">
          <div>
            <h1 className="font-display font-bold text-[5rem] leading-[0.95] tracking-tight mb-6">
              Curator Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <span className="font-mono text-text-secondary text-sm border-b border-border-subtle pb-1">
                {address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Connect wallet to see your agents'}
              </span>
              {address && (
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(address)}
                  className="text-text-tertiary hover:text-text-primary transition-colors"
                  title="Copy address"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              )}
            </div>
          </div>
          <Link
            href="/curator/agents/new"
            className="bg-black text-white font-sans text-xs uppercase tracking-widest px-8 py-4 hover:bg-black/80 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Upload Agent
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-0 border border-border-subtle mb-32">
          <div className="p-12 bg-surface border-r border-border-subtle">
            <p className="text-text-secondary text-xs uppercase tracking-widest mb-4">Total Earned</p>
            <p className="font-display text-6xl text-text-primary">
              <span className="italic mr-1 text-text-tertiary">$</span>{totalEarned.toFixed(4)}
            </p>
          </div>
          <div className="p-12 bg-surface border-r border-border-subtle">
            <p className="text-text-secondary text-xs uppercase tracking-widest mb-4">Active Agents</p>
            <p className="font-display text-6xl text-accent">
              {agents.filter(a => a.active).length}
            </p>
          </div>
          <div className="p-12 bg-surface">
            <p className="text-text-secondary text-xs uppercase tracking-widest mb-4">Pending Payout</p>
            <p className="font-display text-6xl text-text-primary">
              <span className="italic mr-1 text-text-tertiary">$</span>0.0000
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-24">
          <div className="col-span-3">
            <h2 className="font-display text-2xl border-b border-border-strong pb-4 mb-4">My Agents</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Manage your published agents. You earn the curator rate for every second users interact with your agents.
            </p>
          </div>
          <div className="col-span-9">
            {loading ? (
              <div className="animate-pulse space-y-6">
                <div className="h-20 bg-surface-dim" />
                <div className="h-20 bg-surface-dim" />
              </div>
            ) : agents.length === 0 ? (
              <div className="bg-surface-dim p-24 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-4xl text-text-tertiary mb-6">smart_toy</span>
                <h3 className="font-display text-3xl mb-4">No agents published yet</h3>
                <p className="text-text-secondary mb-8 max-w-md">
                  Publish an AI agent to the network and start earning USDC for every second it runs.
                </p>
                <Link href="/curator/agents/new" className="font-display italic text-accent hover:text-accent-muted text-lg transition-colors">
                  Upload your first agent →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col border-t border-border-subtle">
                {agents.map(agent => (
                  <div key={agent.id} className="border-b border-border-subtle py-8 flex justify-between items-start hover:bg-surface-dim transition-colors px-8 group">
                    <div>
                      <h3 className="font-display text-2xl font-bold mb-2 group-hover:text-accent transition-colors">{agent.name}</h3>
                      <p className="text-text-secondary text-sm font-mono mb-4 uppercase tracking-wide">{agent.category}</p>
                      <div className="flex items-center gap-6">
                        <span className="text-text-primary text-sm flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-text-tertiary">payments</span>
                          <span className="font-mono">${(agent.curator_rate_per_second / 1_000_000).toFixed(4)}/sec</span>
                        </span>
                        <span className="text-text-secondary text-sm flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-text-tertiary">account_balance_wallet</span>
                          <span className="font-mono">$0.0000 earned</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs uppercase tracking-widest px-3 py-1 border ${agent.active ? 'border-accent text-accent' : 'border-border-strong text-text-secondary'}`}>
                        {agent.active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(agent.id)}
                        disabled={removing === agent.id}
                        className="text-xs uppercase tracking-widest px-3 py-1 border border-error/50 text-error hover:bg-error/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {removing === agent.id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
