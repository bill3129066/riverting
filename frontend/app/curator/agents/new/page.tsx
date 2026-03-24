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
    githubUrl: '',
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
        githubUrl: form.githubUrl,
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
          metadataUri: form.githubUrl,
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
    <div className="bg-background min-h-screen text-text-primary">
      <div className="max-w-[1920px] mx-auto px-24 pt-24 pb-32">
        <h1 className="font-display font-bold text-[5rem] leading-[0.95] tracking-tight mb-6">Upload New Agent</h1>
        <p className="text-text-secondary text-lg mb-16 max-w-2xl">Define your AI agent's capabilities and pricing to publish to the network.</p>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
          {/* Name */}
          <div>
            <label htmlFor="agent-name" className="block text-xs text-text-secondary uppercase tracking-widest mb-2">Agent Name *</label>
            <input
              id="agent-name"
              value={form.name} onChange={update('name')} required
              placeholder="e.g. DeFi Pool Analyst"
              className="w-full bg-surface-dim border border-border-subtle px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-accent outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="agent-description" className="block text-xs text-text-secondary uppercase tracking-widest mb-2">Description *</label>
            <textarea
              id="agent-description"
              value={form.description} onChange={update('description')} required rows={3}
              placeholder="What does this agent analyze?"
              className="w-full bg-surface-dim border border-border-subtle px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-accent outline-none resize-none transition-colors"
            />
          </div>

          {/* Category + Template */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label htmlFor="agent-category" className="block text-xs text-text-secondary uppercase tracking-widest mb-2">Category</label>
              <select id="agent-category" value={form.category} onChange={update('category')}
                className="w-full bg-surface-dim border border-border-subtle px-4 py-3 text-text-primary focus:border-accent outline-none transition-colors appearance-none">
                <option value="defi">DeFi</option>
                <option value="trading">Trading</option>
                <option value="research">Research</option>
              </select>
            </div>
            <div>
              <label htmlFor="agent-template" className="block text-xs text-text-secondary uppercase tracking-widest mb-2">Analysis Template</label>
              <select id="agent-template" value={form.analysisTemplate} onChange={update('analysisTemplate')}
                className="w-full bg-surface-dim border border-border-subtle px-4 py-3 text-text-primary focus:border-accent outline-none transition-colors appearance-none">
                <option value="pool-snapshot">Pool Snapshot</option>
                <option value="yield-compare">Yield Compare</option>
              </select>
            </div>
          </div>

          {/* Rate */}
          <div>
            <label htmlFor="agent-rate" className="block text-xs text-text-secondary uppercase tracking-widest mb-2">
              Your Rate (USDC micro-units/sec)
            </label>
            <input
              id="agent-rate"
              type="number" value={form.curatorRatePerSecond} onChange={update('curatorRatePerSecond')}
              min="100" max="10000" step="100"
              className="w-full bg-surface-dim border border-border-subtle px-4 py-3 text-text-primary focus:border-accent outline-none transition-colors font-mono"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-text-secondary text-sm italic font-display">{rateInUSDC} USDC/sec</span>
              <span className="text-text-tertiary text-xs">Users pay ${((parseInt(form.curatorRatePerSecond) + 300) / 1_000_000).toFixed(6)}/sec total</span>
            </div>
          </div>

          {/* GitHub URL */}
          <div>
            <label htmlFor="agent-github" className="block text-xs text-text-secondary uppercase tracking-widest mb-2">GitHub Repository URL *</label>
            <input
              id="agent-github"
              type="url" value={form.githubUrl} onChange={update('githubUrl')} required
              placeholder="https://github.com/your-org/your-agent"
              className="w-full bg-surface-dim border border-border-subtle px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-accent outline-none font-mono text-sm transition-colors"
            />
            <p className="text-xs text-text-tertiary mt-2">
              Repo root must contain <code className="text-accent font-mono">skill.json</code> with systemPrompt, model, temperature, analysisTemplates.
            </p>
          </div>

          {error && <p className="text-error text-sm mt-4 font-mono">{error}</p>}

          <button
            type="submit" disabled={loading || !address}
            className="w-full bg-black text-white font-sans text-xs uppercase tracking-widest py-4 mt-8 hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? 'Uploading...' : !address ? 'Connect Wallet First' : 'Upload Agent →'}
          </button>
        </form>
      </div>
    </div>
  )
}
