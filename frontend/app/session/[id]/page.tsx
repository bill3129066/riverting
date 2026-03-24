'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import SalaryTicker from '@/components/session/SalaryTicker'
import ProofHeartbeatTimeline from '@/components/session/ProofHeartbeatTimeline'
import AgentWorkTimeline from '@/components/session/AgentWorkTimeline'
import StreamStatusBadge from '@/components/session/StreamStatusBadge'
import CostBreakdown from '@/components/session/CostBreakdown'

interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

interface AgentStep {
  kind: string
  title: string
  body: string
  ts: string
}

interface ProofEvent {
  seq: number
  proofHash: string
  txHash?: string
  ts: string
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const [status, setStatus] = useState<'active' | 'paused' | 'stopped'>('active')
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [proofs, setProofs] = useState<ProofEvent[]>([])
  const [accrued, setAccrued] = useState(0)
  const [ratePerSec] = useState(1300)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const isValidSession = !!id && id !== 'new'

  useEffect(() => {
    if (!isValidSession || status !== 'active') return
    const interval = setInterval(() => {
      setAccrued(prev => prev + ratePerSec)
    }, 1000)
    return () => clearInterval(interval)
  }, [isValidSession, status, ratePerSec])

  useEffect(() => {
    if (!isValidSession) return
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const connect = () => {
      const es = new EventSource(`${apiBase}/api/sessions/${id}/stream`)
      eventSourceRef.current = es

      es.addEventListener('step', (e) => {
        const step = JSON.parse(e.data)
        setSteps(prev => [...prev.slice(-50), step])
      })

      es.addEventListener('proof', (e) => {
        const proof = JSON.parse(e.data)
        setProofs(prev => [...prev.slice(-20), proof])
      })

      es.addEventListener('status', (e) => {
        const { status: newStatus } = JSON.parse(e.data)
        setStatus(newStatus)
      })

      es.addEventListener('earnings', (e) => {
        const { accrued: newAccrued } = JSON.parse(e.data)
        setAccrued(newAccrued)
      })

      es.onerror = () => {
        es.close()
        setTimeout(connect, 3000)
      }
    }

    connect()
    return () => eventSourceRef.current?.close()
  }, [id, isValidSession])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  async function sendMessage() {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

    const userMsg: ChatMessage = { role: 'user', text }
    const nextHistory = [...chatHistory, userMsg]
    setChatHistory(nextHistory)
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch(`${apiBase}/api/sessions/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: nextHistory.slice(0, -1).map(m => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
        }),
      })
      const data = await res.json()
      setChatHistory(prev => [...prev, { role: 'model', text: data.reply || data.error || 'No response' }])
    } catch {
      setChatHistory(prev => [...prev, { role: 'model', text: 'Failed to reach AI.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Active Session</h1>
          <p className="text-[#666] mb-6">Browse the marketplace to start a session.</p>
          <a href="/marketplace" className="bg-[#00d4aa] text-black font-bold px-6 py-3 rounded-xl">
            Browse Agents →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Live Session</h1>
            <p className="text-[#666] text-sm font-mono">#{id}</p>
          </div>
          <StreamStatusBadge status={status} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Left: Salary + Cost */}
          <div className="space-y-4">
            <SalaryTicker accrued={accrued} ratePerSec={ratePerSec} status={status} />
            <CostBreakdown curatorRate={1000} platformFee={300} />
          </div>

          {/* Center: Agent Work */}
          <div className="col-span-1">
            <AgentWorkTimeline steps={steps} />
          </div>

          {/* Right: Proof Timeline */}
          <div>
            <ProofHeartbeatTimeline proofs={proofs} />
          </div>
        </div>

        {/* Chat with Agent */}
        <div className="mt-6 bg-[#111] border border-[#1a1a1a] rounded-xl flex flex-col h-80">
          <p className="text-xs text-[#666] uppercase tracking-wide px-4 pt-3 pb-2 border-b border-[#1a1a1a]">
            Chat with Agent
          </p>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {chatHistory.length === 0 && (
              <p className="text-[#444] text-sm">Ask the agent anything about the current session...</p>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#00d4aa] text-black'
                    : 'bg-[#1a1a1a] text-[#ccc]'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] text-[#555] rounded-xl px-3 py-2 text-sm">Thinking...</div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
          <div className="flex gap-2 p-3 border-t border-[#1a1a1a]">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask the agent..."
              disabled={chatLoading}
              className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:border-[#00d4aa] outline-none disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={chatLoading || !chatInput.trim()}
              className="bg-[#00d4aa] text-black font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#00b894] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>

        {/* Settlement breakdown — shows when session ends */}
        {status === 'stopped' && (
          <div className="mt-6 bg-[#111] border border-[#00d4aa]/30 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4 text-[#00d4aa]">Session Settlement</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">${(accrued / 1_000_000).toFixed(4)}</div>
                <div className="text-[#666] text-sm">Total Cost</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">${(accrued * 1000 / 1300 / 1_000_000).toFixed(4)}</div>
                <div className="text-[#666] text-sm">Curator Earned</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">${(accrued * 300 / 1300 / 1_000_000).toFixed(4)}</div>
                <div className="text-[#666] text-sm">Platform Fee</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
