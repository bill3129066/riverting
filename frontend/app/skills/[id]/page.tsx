'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useSignMessage } from 'wagmi'
import {
  fetchSkill, runSkill, runSkillStream, chatWithSkill,
  fetchSkillExecutions, deleteSkill, fetchBalance, depositFunds,
  rateSkill as rateSkillApi, fetchUserRating,
} from '@/lib/skills-api'
import { signAction } from '@/lib/sign-action'

interface Skill {
  id: string; name: string; description: string; category: string
  system_prompt: string; user_prompt_template: string | null
  model: string; temperature: number; max_tokens: number
  input_schema_json: string | null; price_per_run: number
  execution_mode: string; run_count: number; avg_rating: number | null
  creator_wallet: string; created_at: string
}

interface InputField { name: string; type: string; required: boolean }
interface ChatMsg { role: 'user' | 'model'; text: string }
interface Execution {
  id: string; user_wallet: string; status: string
  output_text: string | null; duration_ms: number | null
  tokens_used: number | null; created_at: string; error_message: string | null
}

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

function formatPrice(microUnits: number): string {
  if (microUnits === 0) return 'Free'
  return `$${(microUnits / 1_000_000).toFixed(4)}`
}

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const router = useRouter()
  const [skill, setSkill] = useState<Skill | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [depositing, setDepositing] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [ratingHover, setRatingHover] = useState(0)
  const [executions, setExecutions] = useState<Execution[]>([])
  const [execTab, setExecTab] = useState<'all' | 'mine'>('all')

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatStarted, setChatStarted] = useState(false)
  const [toolActivity, setToolActivity] = useState<string[]>([])
  const [toolCallCount, setToolCallCount] = useState(0)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSkill(id).then(setSkill).catch(console.error).finally(() => setLoading(false))
    fetchSkillExecutions(id, address?.toLowerCase()).then(setExecutions).catch(() => {})
  }, [id, address])

  useEffect(() => {
    if (address) {
      fetchBalance(address).then(b => setBalance(b.balance)).catch(() => {})
      fetchUserRating(id, address).then(setUserRating).catch(() => {})
    }
  }, [address, id])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatLoading])

  // Load chat from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(`skill_chat_${id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setChatHistory(parsed)
        if (parsed.length > 0) setChatStarted(true)
      }
    } catch {}
  }, [id])

  // Save chat to localStorage
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(`skill_chat_${id}`, JSON.stringify(chatHistory))
    }
  }, [chatHistory, id])

  const inputFields = skill ? parseInputSchema(skill.input_schema_json) : []
  const isOwner = skill && address && skill.creator_wallet.toLowerCase() === address.toLowerCase()

  const filteredExecutions = execTab === 'mine' && address
    ? executions.filter(e => e.user_wallet.toLowerCase() === address.toLowerCase())
    : executions

  const handleRate = async (rating: number) => {
    if (!address) return
    try {
      const auth = await signAction(signMessageAsync, address, 'rate-skill', id)
      const result = await rateSkillApi(id, rating, auth)
      setUserRating(rating)
      if (skill) setSkill({ ...skill, avg_rating: result.avg_rating })
    } catch (e: any) { alert(e.message) }
  }

  const handleDeposit = async () => {
    if (!address) return
    setDepositing(true)
    try {
      const auth = await signAction(signMessageAsync, address, 'deposit')
      const result = await depositFunds(5_000_000, auth)
      setBalance(result.balance)
    } catch (e: any) { alert(e.message) }
    finally { setDepositing(false) }
  }

  const handleDelete = async () => {
    if (!address || !confirm('Are you sure you want to delete this skill?')) return
    try {
      const auth = await signAction(signMessageAsync, address, 'delete-skill', id)
      await deleteSkill(id, auth)
      router.push('/skills')
    } catch (e: any) { alert(e.message) }
  }

  const handleClearChat = () => {
    setChatHistory([])
    setChatStarted(false)
    setToolActivity([])
    setToolCallCount(0)
    localStorage.removeItem(`skill_chat_${id}`)
  }

  // Send message in chat mode
  const sendMessage = async (overrideMessage?: string) => {
    const text = (overrideMessage || chatInput).trim()
    if (!text || chatLoading || !address) return
    if (!overrideMessage) setChatInput('')

    const userMsg: ChatMsg = { role: 'user', text }
    setChatHistory(prev => [...prev, userMsg])
    setChatLoading(true)
    setError('')

    try {
      const auth = await signAction(signMessageAsync, address, 'run-skill', id)

      // Build Gemini-format history (exclude the message we're about to send)
      const geminiHistory = chatHistory.map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      }))

      const result = await chatWithSkill(id, text, geminiHistory, inputs, auth)

      if (result.toolCallCount > 0) {
        setToolCallCount(prev => prev + result.toolCallCount)
        setToolActivity(prev => [...prev, `${result.toolCallCount} RPC calls`])
      }

      setChatHistory(prev => [...prev, { role: 'model', text: result.reply }])
    } catch (e: any) {
      setError(e.message)
      setChatHistory(prev => [...prev, { role: 'model', text: `Error: ${e.message}` }])
    } finally {
      setChatLoading(false)
    }
  }

  // Start chat with initial inputs
  const handleStartChat = () => {
    if (!address) { setError('Connect wallet first'); return }
    setChatStarted(true)

    // Build initial message from inputs
    const parts: string[] = []
    if (inputFields.length > 0) {
      inputFields.forEach(f => {
        if (inputs[f.name]) parts.push(`${f.name}: ${inputs[f.name]}`)
      })
    } else if (inputs._query) {
      parts.push(inputs._query)
    }

    const initialMessage = parts.length > 0 ? parts.join('\n') : 'Start analysis'
    sendMessage(initialMessage)
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
            <span className="text-xs bg-[#222] text-[#888] px-2 py-1 rounded-full">Chat Mode</span>
            <span className="text-xs text-[#666]">{skill.run_count} runs</span>
            {skill.avg_rating && <span className="text-xs text-[#888]">{'★'} {skill.avg_rating.toFixed(1)}</span>}
          </div>
          <h1 className="text-3xl font-bold mb-1">{skill.name}</h1>
          <p className="text-[#888]">{skill.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-[#555]">
              By {skill.creator_wallet.slice(0, 6)}...{skill.creator_wallet.slice(-4)} · {skill.model} · {formatPrice(skill.price_per_run)}/msg
            </p>
            {isOwner && (
              <button onClick={handleDelete}
                className="text-xs text-[#666] hover:text-red-400 border border-[#333] hover:border-red-400/50 px-2 py-0.5 rounded transition-colors">
                Delete Skill
              </button>
            )}
          </div>
        </div>

        {/* Main area */}
        {!chatStarted ? (
          /* ── Pre-chat: Input form ── */
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6 max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Start a conversation</h2>
            <p className="text-sm text-[#666] mb-4">Fill in the parameters below to begin. You can ask follow-up questions after the initial analysis.</p>

            {inputFields.length > 0 ? (
              <div className="space-y-4">
                {inputFields.map(field => (
                  <div key={field.name}>
                    <label className="block text-sm text-[#888] mb-1.5">
                      {field.name} {field.required && <span className="text-[#00d4aa]">*</span>}
                    </label>
                    <input type={field.type} value={inputs[field.name] || ''}
                      onChange={e => setInputs(prev => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={`Enter ${field.name}`} required={field.required} className={inputCls}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-sm text-[#888] mb-1.5">Query</label>
                <textarea value={inputs._query || ''}
                  onChange={e => setInputs(prev => ({ ...prev, _query: e.target.value }))}
                  placeholder="Enter your query..."
                  rows={3} className={`${inputCls} resize-none`}
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

            <button onClick={handleStartChat} disabled={!address}
              className="w-full mt-4 bg-[#00d4aa] text-black font-bold py-3 rounded-xl hover:bg-[#00b894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {!address ? 'Connect Wallet First' : 'Start Conversation'}
            </button>

            {/* Balance info */}
            {address && (
              <div className="mt-4 flex items-center justify-between text-xs text-[#555]">
                <span>
                  Platform balance:
                  <span className="text-[#00d4aa] ml-1">
                    {balance !== null ? `$${(balance / 1_000_000).toFixed(4)}` : '...'}
                  </span>
                </span>
                <button onClick={handleDeposit} disabled={depositing}
                  className="text-[#444] hover:text-[#666] transition-colors disabled:opacity-50">
                  {depositing ? 'Depositing...' : '+ Deposit'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Chat interface ── */
          <div className="flex flex-col h-[calc(100vh-280px)]">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto bg-[#111] border border-[#1a1a1a] rounded-t-xl p-4 space-y-4">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/20'
                      : 'bg-[#1a1a1a] text-[#ccc] border border-[#222]'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1a1a] text-[#666] border border-[#222] rounded-xl px-4 py-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-[#333] border-t-[#00d4aa] rounded-full animate-spin" />
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Tool activity bar */}
            {toolActivity.length > 0 && (
              <div className="bg-[#0a0a0a] border-x border-[#1a1a1a] px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-[#666]">
                  <span>Tools: {toolCallCount} calls</span>
                  <div className="flex flex-wrap gap-1">
                    {toolActivity.slice(-5).map((a, i) => (
                      <span key={i} className="bg-[#222] text-[#888] px-1.5 py-0.5 rounded">{a}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chat input */}
            <div className="bg-[#111] border border-t-0 border-[#1a1a1a] rounded-b-xl p-4">
              <div className="flex gap-3">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:border-[#00d4aa] outline-none text-sm"
                  disabled={chatLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-[#00d4aa] text-black font-bold px-6 rounded-xl hover:bg-[#00b894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
                <button
                  onClick={handleClearChat}
                  className="text-xs text-[#666] hover:text-[#888] border border-[#333] px-3 rounded-xl transition-colors"
                  title="Clear chat and start over"
                >
                  Clear
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              <div className="flex items-center justify-between mt-2 text-xs text-[#555]">
                <span>
                  Balance: <span className="text-[#00d4aa]">{balance !== null ? `$${(balance / 1_000_000).toFixed(4)}` : '...'}</span>
                </span>
                <span>{chatHistory.filter(m => m.role === 'model').length} responses</span>
              </div>
            </div>
          </div>
        )}

        {/* Rating */}
        {address && chatHistory.length > 0 && (
          <div className="mt-6 bg-[#111] border border-[#1a1a1a] rounded-xl p-4 flex items-center gap-4">
            <span className="text-sm text-[#888]">Rate this skill:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => handleRate(star)}
                  onMouseEnter={() => setRatingHover(star)} onMouseLeave={() => setRatingHover(0)}
                  className="text-xl transition-colors">
                  <span className={(ratingHover || userRating || 0) >= star ? 'text-yellow-400' : 'text-[#333]'}>{'★'}</span>
                </button>
              ))}
            </div>
            {userRating && <span className="text-xs text-[#666]">Your rating: {userRating}/5</span>}
            {skill.avg_rating && <span className="text-xs text-[#666]">Avg: {skill.avg_rating.toFixed(1)}</span>}
          </div>
        )}

        {/* Recent Executions */}
        {executions.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold">Recent Executions</h2>
              <div className="flex gap-2">
                <button onClick={() => setExecTab('all')}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    execTab === 'all' ? 'bg-[#00d4aa]/10 text-[#00d4aa]' : 'text-[#666] hover:text-white'}`}>
                  All ({executions.length})
                </button>
                {address && (
                  <button onClick={() => setExecTab('mine')}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      execTab === 'mine' ? 'bg-[#00d4aa]/10 text-[#00d4aa]' : 'text-[#666] hover:text-white'}`}>
                    Mine ({executions.filter(e => e.user_wallet.toLowerCase() === address.toLowerCase()).length})
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {filteredExecutions.slice(0, 10).map(exec => (
                <div key={exec.id} className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3 flex items-start gap-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                    exec.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    exec.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'}`}>
                    {exec.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#ccc] truncate">
                      {exec.output_text || exec.error_message || 'No output'}
                    </p>
                    <div className="flex gap-3 text-xs text-[#555] mt-1">
                      <span>{exec.user_wallet.slice(0, 6)}...{exec.user_wallet.slice(-4)}</span>
                      <span>{new Date(exec.created_at).toLocaleString()}</span>
                      {exec.duration_ms && <span>{exec.duration_ms}ms</span>}
                      {exec.tokens_used && <span>{exec.tokens_used} tokens</span>}
                    </div>
                  </div>
                </div>
              ))}
              {filteredExecutions.length === 0 && (
                <p className="text-sm text-[#555] py-4 text-center">No executions yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
