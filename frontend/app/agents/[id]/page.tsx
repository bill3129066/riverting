'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount, useSignMessage } from 'wagmi'
import {
  fetchAgent, createSession, rateAgent, fetchUserRating,
  fetchBalance, depositFunds, fetchAgentStats,
} from '@/lib/agents-api'
import { signAction } from '@/lib/sign-action'

interface Agent {
  id: string; name: string; description: string; category: string
  system_prompt: string; user_prompt_template: string | null
  model: string; temperature: number; max_tokens: number
  input_schema_json: string | null; rate_per_second: number
  run_count: number; avg_rating: number | null
  creator_wallet: string; created_at: string
}

interface InputField { name: string; type: string; required: boolean }

function parseInputSchema(schemaJson: string | null): InputField[] {
  if (!schemaJson) return []
  try {
    const schema = JSON.parse(schemaJson)
    const props = schema.properties || {}
    const required: string[] = schema.required || []
    return Object.entries(props).map(([name, def]: [string, any]) => ({
      name, type: def.type === 'number' ? 'number' : 'text', required: required.includes(name),
    }))
  } catch { return [] }
}

function formatRate(microPerSec: number): string {
  if (microPerSec === 0) return 'Free'
  return `$${(microPerSec / 1_000_000).toFixed(4)}/sec`
}

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [ratingHover, setRatingHover] = useState(0)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchAgent(id).then(a => { setAgent(a); setLoading(false) }).catch(() => { setError('Agent not found'); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!address) return
    fetchBalance(address).then(b => setBalance(b.balance)).catch(() => {})
    if (id) fetchUserRating(id, address).then(r => setUserRating(r)).catch(() => {})
  }, [address, id])

  const handleStartSession = async () => {
    if (!address || !agent) return
    setStarting(true)
    try {
      const auth = await signAction(signMessageAsync, address, 'create-session', agent.id)
      const session = await createSession(agent.id, inputs, auth)
      router.push(`/sessions/${session.id}`)
    } catch (e: any) {
      setError(e.message || 'Failed to start session')
      setStarting(false)
    }
  }

  const handleRate = async (rating: number) => {
    if (!address || !id) return
    try {
      const auth = await signAction(signMessageAsync, address, 'rate-agent', id)
      const result = await rateAgent(id, rating, auth)
      setUserRating(rating)
      if (agent) setAgent({ ...agent, avg_rating: result.avg_rating })
    } catch {}
  }

  const handleDeposit = async () => {
    if (!address) return
    try {
      const auth = await signAction(signMessageAsync, address, 'deposit')
      const result = await depositFunds(10_000_000, auth)
      setBalance(result.balance)
    } catch {}
  }

  if (loading) return <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center"><p className="text-[var(--text-secondary)] font-display">Loading...</p></div>
  if (error || !agent) return <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center"><p className="text-red-400 font-display">{error || 'Agent not found'}</p></div>

  const fields = parseInputSchema(agent.input_schema_json)
  const hasFields = fields.length > 0

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 text-xs font-mono uppercase tracking-wider bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 rounded">{agent.category}</span>
            <span className="text-[var(--text-secondary)] text-sm font-mono">{agent.run_count} runs</span>
          </div>
          <h1 className="font-display text-4xl font-bold mb-2">{agent.name}</h1>
          <p className="text-[var(--text-secondary)] text-lg mb-4">{agent.description}</p>
          <div className="flex items-center gap-6 text-sm">
            <span className="font-mono text-[var(--accent)]">{formatRate(agent.rate_per_second)}</span>
            <span className="text-[var(--text-secondary)]">by {agent.creator_wallet.slice(0,6)}...{agent.creator_wallet.slice(-4)}</span>
            <span className="text-[var(--text-secondary)]">{agent.model}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-8">
          {[1,2,3,4,5].map(star => (
            <button key={star} type="button" onClick={() => handleRate(star)} onMouseEnter={() => setRatingHover(star)} onMouseLeave={() => setRatingHover(0)}
              className={`text-2xl transition-colors ${(ratingHover || userRating || 0) >= star ? 'text-yellow-400' : 'text-[var(--text-secondary)]/30'}`}>★</button>
          ))}
          {agent.avg_rating && <span className="text-sm text-[var(--text-secondary)] ml-2">{agent.avg_rating.toFixed(1)} avg</span>}
        </div>

        {/* Input Form */}
        <div className="border border-[var(--border-strong)] rounded-lg p-6 mb-6 bg-[var(--surface-elevated)]">
          <h2 className="font-display text-lg font-semibold mb-4">Session Inputs</h2>
          {hasFields ? fields.map(field => (
            <div key={field.name} className="mb-4">
              <label className="block text-sm font-mono text-[var(--text-secondary)] mb-1">{field.name}{field.required && <span className="text-red-400 ml-1">*</span>}</label>
              <input type={field.type} value={inputs[field.name] || ''} onChange={e => setInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent)] focus:outline-none" />
            </div>
          )) : (
            <div className="mb-4">
              <label className="block text-sm font-mono text-[var(--text-secondary)] mb-1">Query</label>
              <textarea value={inputs._query || ''} onChange={e => setInputs({ _query: e.target.value })} rows={3}
                className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent)] focus:outline-none resize-none" placeholder="What would you like the agent to analyze?" />
            </div>
          )}

          <div className="flex items-center gap-4">
            <button type="button" onClick={handleStartSession} disabled={!address || starting}
              className="px-6 py-3 bg-[var(--accent)] text-black font-display font-bold rounded hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
              {starting ? 'Starting...' : address ? 'Start Session' : 'Connect Wallet'}
            </button>
            {balance !== null && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <span className="font-mono">Balance: ${(balance / 1_000_000).toFixed(2)}</span>
                <button type="button" onClick={handleDeposit} className="text-[var(--accent)] hover:underline text-xs">+$10</button>
              </div>
            )}
          </div>
        </div>

        {/* Model Info */}
        <div className="border border-[var(--border)] rounded-lg p-4 text-sm text-[var(--text-secondary)]">
          <div className="grid grid-cols-3 gap-4 font-mono">
            <div><span className="text-[var(--text-secondary)]/60">Model</span><br/>{agent.model}</div>
            <div><span className="text-[var(--text-secondary)]/60">Temperature</span><br/>{agent.temperature}</div>
            <div><span className="text-[var(--text-secondary)]/60">Max Tokens</span><br/>{agent.max_tokens}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
