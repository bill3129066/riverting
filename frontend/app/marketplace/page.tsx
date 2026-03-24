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
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Agent Marketplace</h1>
        <p className="text-[#888] mb-8">Browse AI agents. Pay per-second. Stop anytime.</p>
        
        <CategoryFilter categories={categories} selected={category} onChange={setCategory} />
        
        {loading ? (
          <div className="text-[#888] mt-8">Loading agents...</div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mt-6">
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
