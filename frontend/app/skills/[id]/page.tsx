'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { fetchSkill, runSkill, fetchSkillExecutions } from '@/lib/skills-api'

interface Skill {
  id: string
  name: string
  description: string
  category: string
  system_prompt: string
  user_prompt_template: string | null
  model: string
  temperature: number
  max_tokens: number
  input_schema_json: string | null
  price_per_run: number
  execution_mode: string
  run_count: number
  avg_rating: number | null
  creator_wallet: string
  created_at: string
}

interface InputField {
  name: string
  type: string
  required: boolean
}

interface Execution {
  id: string
  status: string
  output_text: string | null
  duration_ms: number | null
  tokens_used: number | null
  created_at: string
  error_message: string | null
}

function parseInputSchema(schemaJson: string | null): InputField[] {
  if (!schemaJson) return []
  try {
    const schema = JSON.parse(schemaJson)
    const props = schema.properties || {}
    const required: string[] = schema.required || []
    return Object.entries(props).map(([name, def]: [string, any]) => ({
      name,
      type: def.type === 'number' ? 'number' : 'text',
      required: required.includes(name),
    }))
  } catch {
    return []
  }
}

function formatPrice(microUnits: number): string {
  if (microUnits === 0) return 'Free'
  return `$${(microUnits / 1_000_000).toFixed(4)}`
}

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { address } = useAccount()
  const [skill, setSkill] = useState<Skill | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [output, setOutput] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [execStats, setExecStats] = useState<{ durationMs: number; tokensUsed: number | null } | null>(null)
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSkill(id).then(setSkill).catch(console.error).finally(() => setLoading(false))
    fetchSkillExecutions(id).then(setExecutions).catch(() => {})
  }, [id])

  const inputFields = skill ? parseInputSchema(skill.input_schema_json) : []

  const handleRun = async () => {
    if (!address) { setError('Connect wallet first'); return }
    setRunning(true)
    setError('')
    setOutput(null)
    setExecStats(null)

    try {
      const result = await runSkill(id, address, inputs)
      if (result.status === 'failed') {
        setError(result.error || 'Execution failed')
      } else {
        setOutput(result.output)
        setExecStats({ durationMs: result.durationMs, tokensUsed: result.tokensUsed })
      }
      // Refresh executions
      fetchSkillExecutions(id).then(setExecutions).catch(() => {})
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white p-8"><p className="text-[#888]">Loading...</p></div>
  if (!skill) return <div className="min-h-screen bg-[#0a0a0a] text-white p-8"><p className="text-red-400">Skill not found</p></div>

  const inputCls = 'w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:border-[#00d4aa] outline-none'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs bg-[#00d4aa]/10 text-[#00d4aa] px-2 py-1 rounded-full uppercase tracking-wide">
              {skill.category}
            </span>
            <span className="text-xs bg-[#222] text-[#888] px-2 py-1 rounded-full">
              {skill.execution_mode === 'once' ? 'Single Run' : 'Streaming'}
            </span>
            <span className="text-xs text-[#666]">{skill.run_count} runs</span>
            {skill.avg_rating && <span className="text-xs text-[#888]">{'★'} {skill.avg_rating.toFixed(1)}</span>}
          </div>
          <h1 className="text-3xl font-bold mb-1">{skill.name}</h1>
          <p className="text-[#888]">{skill.description}</p>
          <p className="text-xs text-[#555] mt-2">
            By {skill.creator_wallet.slice(0, 6)}...{skill.creator_wallet.slice(-4)} · {skill.model} · {formatPrice(skill.price_per_run)}/run
          </p>
        </div>

        {/* Main: Input + Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Form */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Input</h2>

            {inputFields.length > 0 ? (
              <div className="space-y-4">
                {inputFields.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm text-[#888] mb-1.5">
                      {field.name} {field.required && <span className="text-[#00d4aa]">*</span>}
                    </label>
                    <input
                      type={field.type}
                      value={inputs[field.name] || ''}
                      onChange={e => setInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={`Enter ${field.name}`}
                      required={field.required}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-sm text-[#888] mb-1.5">Query</label>
                <textarea
                  value={inputs._query || ''}
                  onChange={e => setInputs(prev => ({ ...prev, _query: e.target.value }))}
                  placeholder="Enter your query or leave empty for default analysis..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

            <button
              onClick={handleRun}
              disabled={running || !address}
              className="w-full mt-4 bg-[#00d4aa] text-black font-bold py-3 rounded-xl hover:bg-[#00b894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Running...
                </span>
              ) : !address ? 'Connect Wallet First' : `Run Skill${skill.price_per_run > 0 ? ` (${formatPrice(skill.price_per_run)})` : ''}`}
            </button>
          </div>

          {/* Right: Output */}
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Output</h2>

            {output ? (
              <div>
                <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 text-sm text-[#ccc] whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                  {output}
                </div>
                {execStats && (
                  <div className="flex gap-4 mt-3 text-xs text-[#666]">
                    <span>{execStats.durationMs}ms</span>
                    {execStats.tokensUsed && <span>{execStats.tokensUsed} tokens</span>}
                  </div>
                )}
              </div>
            ) : running ? (
              <div className="flex items-center justify-center h-32 text-[#666]">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#333] border-t-[#00d4aa] rounded-full animate-spin" />
                  Executing skill...
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-[#555]">
                Run the skill to see output here
              </div>
            )}
          </div>
        </div>

        {/* Recent Executions */}
        {executions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Recent Executions</h2>
            <div className="space-y-2">
              {executions.slice(0, 10).map(exec => (
                <div key={exec.id} className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3 flex items-start gap-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                    exec.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    exec.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {exec.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#ccc] truncate">
                      {exec.output_text || exec.error_message || 'No output'}
                    </p>
                    <div className="flex gap-3 text-xs text-[#555] mt-1">
                      <span>{new Date(exec.created_at).toLocaleString()}</span>
                      {exec.duration_ms && <span>{exec.duration_ms}ms</span>}
                      {exec.tokens_used && <span>{exec.tokens_used} tokens</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
