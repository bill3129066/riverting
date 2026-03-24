'use client'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function NewAgentPage() {
  const { address } = useAccount()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'defi',
    curatorRatePerSecond: '1000',
    systemPrompt: '',
    analysisTemplate: 'pool-snapshot',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) { setError('Connect wallet first'); return }
    setLoading(true)
    setError('')

    try {
      const skillConfig = {
        name: form.name,
        systemPrompt: form.systemPrompt || `You are ${form.name}. ${form.description}. Analyze DeFi data and provide clear insights.`,
        model: 'gemini-2.0-flash',
        temperature: 0.3,
        tools: [{ type: 'onchainos-market', description: 'Fetch market data' }],
        analysisTemplates: [form.analysisTemplate],
        maxSessionDuration: 3600,
      }

      const res = await fetch(`${API_BASE}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          curatorWallet: address,
          curatorRatePerSecond: parseInt(form.curatorRatePerSecond),
          skillConfigJson: JSON.stringify(skillConfig),
        }),
      })

      if (!res.ok) throw new Error('Failed to create agent')
      router.push('/marketplace')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const rateInUSDC = (parseInt(form.curatorRatePerSecond) / 1_000_000).toFixed(6)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Upload New Agent</h1>
        <p className="text-[#666] mb-8">Define your AI agent's capabilities and pricing.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="agent-name" className="block text-sm text-[#888] mb-1.5">Agent Name *</label>
            <input
              id="agent-name"
              value={form.name} onChange={update('name')} required
              placeholder="e.g. DeFi Pool Analyst"
              className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:border-[#00d4aa] outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="agent-description" className="block text-sm text-[#888] mb-1.5">Description *</label>
            <textarea
              id="agent-description"
              value={form.description} onChange={update('description')} required rows={3}
              placeholder="What does this agent analyze?"
              className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:border-[#00d4aa] outline-none resize-none"
            />
          </div>

          {/* Category + Template */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="agent-category" className="block text-sm text-[#888] mb-1.5">Category</label>
              <select id="agent-category" value={form.category} onChange={update('category')}
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white focus:border-[#00d4aa] outline-none">
                <option value="defi">DeFi</option>
                <option value="trading">Trading</option>
                <option value="research">Research</option>
              </select>
            </div>
            <div>
              <label htmlFor="agent-template" className="block text-sm text-[#888] mb-1.5">Analysis Template</label>
              <select id="agent-template" value={form.analysisTemplate} onChange={update('analysisTemplate')}
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white focus:border-[#00d4aa] outline-none">
                <option value="pool-snapshot">Pool Snapshot</option>
                <option value="yield-compare">Yield Compare</option>
              </select>
            </div>
          </div>

          {/* Rate */}
          <div>
            <label htmlFor="agent-rate" className="block text-sm text-[#888] mb-1.5">
              Your Rate (USDC micro-units/sec) — {rateInUSDC} USDC/sec
            </label>
            <input
              id="agent-rate"
              type="number" value={form.curatorRatePerSecond} onChange={update('curatorRatePerSecond')}
              min="100" max="10000" step="100"
              className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white focus:border-[#00d4aa] outline-none"
            />
            <p className="text-xs text-[#555] mt-1">Platform adds $0.0003/sec. Users pay ${((parseInt(form.curatorRatePerSecond) + 300) / 1_000_000).toFixed(6)}/sec total.</p>
          </div>

          {/* System Prompt */}
          <div>
            <label htmlFor="agent-prompt" className="block text-sm text-[#888] mb-1.5">System Prompt (optional)</label>
            <textarea
              id="agent-prompt"
              value={form.systemPrompt} onChange={update('systemPrompt')} rows={4}
              placeholder="Leave blank to use default prompt based on name + description"
              className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:border-[#00d4aa] outline-none resize-none font-mono text-sm"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading || !address}
            className="w-full bg-[#00d4aa] text-black font-bold py-3.5 rounded-xl hover:bg-[#00b894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Uploading...' : !address ? 'Connect Wallet First' : 'Upload Agent →'}
          </button>
        </form>
      </div>
    </div>
  )
}