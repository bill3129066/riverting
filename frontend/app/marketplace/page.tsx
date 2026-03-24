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
              Browse AI agents. Pay per-second. Stop anytime.
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
          <div className="text-text-tertiary font-sans text-sm uppercase tracking-widest animate-pulse">Loading directory...</div>
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
