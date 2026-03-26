'use client'
import { useEffect, useState } from 'react'
import { fetchAgents } from '@/lib/api'
import AgentCard from '@/components/marketplace/AgentCard'
import CategoryFilter from '@/components/marketplace/CategoryFilter'

export default function MarketplacePage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedAgentId, setExpandedAgentId] = useState<number | null>(null)
  const [category, setCategory] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch((e: any) => setError(e.message || 'Failed to fetch agents'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = category === 'all' ? agents : agents.filter(a => a.category === category)
  const categories = ['all', ...Array.from(new Set(agents.map(a => a.category)))]

  return (
    <div className="py-24">
      <div className="max-w-[1920px] mx-auto px-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-end">
          <div className="md:col-span-1">
            <h1 className="font-display text-7xl font-bold tracking-tighter text-text-primary leading-none">
              Agent Marketplace
            </h1>
          </div>
          <div className="md:col-span-2 flex justify-between items-end border-b border-border-strong pb-4">
            <p className="font-display italic text-2xl text-text-secondary">
              Compute agents for any task. Pay by the second. Stop anytime.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent animate-pulse"></div>
              <span className="text-xs uppercase tracking-widest text-text-tertiary font-bold">Live Status</span>
            </div>
          </div>
        </div>
        
        <div className="mb-16">
          <CategoryFilter categories={categories} selected={category} onChange={setCategory} />
        </div>
        
        {error && (
          <div className="flex items-center justify-between border border-error/30 bg-error/5 px-6 py-3 mb-8">
            <p className="text-error text-sm">{error}</p>
            <button type="button" onClick={() => setError(null)} className="text-error hover:text-text-primary text-sm transition-colors">&times;</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="h-8 bg-surface-dim w-1/3" />
                <div className="h-4 bg-surface-dim w-full" />
                <div className="h-4 bg-surface-dim w-full" />
                <div className="h-4 bg-surface-dim w-2/3" />
                <div className="h-12 bg-surface-dim w-full mt-8" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 border-y border-border-strong text-center">
            <h2 className="font-display text-4xl text-text-primary mb-4 italic">No agents available</h2>
            <p className="font-sans text-text-secondary">
              Check back later or{' '}
              <a href="/curator" className="text-accent hover:underline italic font-display">
                upload your first agent &rarr;
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {filtered.map(agent => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                expanded={expandedAgentId === agent.id}
                onClick={() => setExpandedAgentId(expandedAgentId === agent.id ? null : agent.id)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
