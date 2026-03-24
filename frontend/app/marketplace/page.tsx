'use client'
import { useEffect, useState } from 'react'
import { fetchAgents } from '@/lib/api'
import AgentCard from '@/components/marketplace/AgentCard'
import AgentDetailModal from '@/components/marketplace/AgentDetailModal'
import CategoryFilter from '@/components/marketplace/CategoryFilter'

export default function MarketplacePage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [category, setCategory] = useState<string>('all')

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch(console.error)
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
        
        {loading ? (
          <div className="space-y-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="h-8 bg-surface-dim w-1/3" />
                <div className="h-4 bg-surface-dim w-full" />
                <div className="h-4 bg-surface-dim w-full" />
                <div className="h-4 bg-surface-dim w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 border-y border-border-strong text-center">
            <h2 className="font-display text-4xl text-text-primary mb-4 italic">Catalog empty</h2>
            <p className="font-sans text-text-secondary">
              No agents currently available. Build and{' '}
              <a href="/curator" className="text-accent hover:underline italic font-display">
                upload your agent &rarr;
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {filtered.map(agent => (
              <AgentCard key={agent.id} agent={agent} onClick={() => setSelectedAgent(agent)} />
            ))}
          </div>
        )}
        
        {selectedAgent && (
          <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
        )}
      </div>
    </div>
  )
}
