'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount, useSignMessage } from 'wagmi'
import { signAction } from '@/lib/auth'
import { chatInSession, pauseSession, resumeSession, stopSession } from '@/lib/agents-api'

import SalaryTicker from '@/components/session/SalaryTicker'
import ProofHeartbeatTimeline from '@/components/session/ProofHeartbeatTimeline'
import AgentWorkTimeline from '@/components/session/AgentWorkTimeline'
import StreamStatusBadge from '@/components/session/StreamStatusBadge'
import CostBreakdown from '@/components/session/CostBreakdown'
import MagiConsensusEngine from '@/components/session/MagiConsensusEngine'

interface ChatMessage {
  id: string
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
  const router = useRouter()
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [status, setStatus] = useState<'active' | 'paused' | 'stopped'>('active')
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [proofs, setProofs] = useState<ProofEvent[]>([])
  const [accrued, setAccrued] = useState(0)
  const [ratePerSec] = useState(1300)
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(`chat_${id}`)
      if (!saved) return []
      return JSON.parse(saved).map((m: any) => ({
        ...m,
        id: m.id || crypto.randomUUID()
      }))
    } catch { return [] }
  })
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  
  const [toolCallCount, setToolCallCount] = useState(0)
  interface ToolActivityItem {
    id: string
    name: string
  }
  const [toolActivity, setToolActivity] = useState<ToolActivityItem[]>([])

  const chatBottomRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const isValidSession = !!id && id !== 'new'

  useEffect(() => {
    if (!isValidSession) {
      router.replace('/marketplace')
    }
  }, [isValidSession, router])

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

      es.addEventListener('chunk', (e) => {
        const { chunk } = JSON.parse(e.data)
        setChatHistory(prev => {
          const next = [...prev]
          if (next.length > 0 && next[next.length - 1].role === 'model') {
            next[next.length - 1].text += chunk
          } else {
            next.push({ id: crypto.randomUUID(), role: 'model', text: chunk })
          }
          return next
        })
        setChatLoading(false)
      })

      es.addEventListener('tool_use', (e) => {
        const tool = JSON.parse(e.data)
        setToolActivity(prev => [...prev.slice(-9), { id: crypto.randomUUID(), name: tool.name }])
        setToolCallCount(prev => prev + 1)
      })

      es.addEventListener('tool_result', () => {})

      es.addEventListener('complete', () => {
        setChatLoading(false)
      })

      es.addEventListener('error', (e) => {
        const { error } = JSON.parse(e.data)
        setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: `Error: ${error}` }])
        setChatLoading(false)
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
    if (isValidSession && chatHistory.length > 0) {
      localStorage.setItem(`chat_${id}`, JSON.stringify(chatHistory))
    }
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, id, isValidSession])

  const handlePause = async () => {
    if (!address) return
    setIsActionLoading(true)
    try {
      const auth = await signAction(signMessageAsync, address, 'pause-session', id)
      await pauseSession(id, auth)
    } catch (e: any) {
      alert(`Failed to pause: ${e.message}`)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleResume = async () => {
    if (!address) return
    setIsActionLoading(true)
    try {
      const auth = await signAction(signMessageAsync, address, 'resume-session', id)
      await resumeSession(id, auth)
    } catch (e: any) {
      alert(`Failed to resume: ${e.message}`)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleStop = async () => {
    if (!address) return
    if (!confirm('Are you sure you want to completely stop this session?')) return
    setIsActionLoading(true)
    try {
      const auth = await signAction(signMessageAsync, address, 'stop-session', id)
      await stopSession(id, auth)
    } catch (e: any) {
      alert(`Failed to stop: ${e.message}`)
    } finally {
      setIsActionLoading(false)
    }
  }

  async function sendMessage() {
    const text = chatInput.trim()
    if (!text || chatLoading || !address) return

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text }
    const nextHistory = [...chatHistory, userMsg]
    setChatHistory(nextHistory)
    setChatInput('')
    setChatLoading(true)

    try {
      const auth = await signAction(signMessageAsync, address, 'chat', id)
      
      const geminiHistory = nextHistory.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      }))
      
      const { reply, toolCallCount: newToolCount } = await chatInSession(id, text, geminiHistory, auth)
      
      setChatHistory(prev => {
        const next = [...prev]
        if (next.length > 0 && next[next.length - 1].role === 'model') {
          next[next.length - 1].text = reply || next[next.length - 1].text
        } else if (reply) {
          next.push({ id: crypto.randomUUID(), role: 'model', text: reply })
        }
        return next
      })
      
      if (newToolCount) {
        setToolCallCount(prev => prev + newToolCount)
      }
    } catch (e: any) {
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: `Failed to reach AI: ${e.message}` }])
    } finally {
      setChatLoading(false)
    }
  }

  if (!isValidSession) {
    return null
  }

  return (
    <div className="max-w-[1920px] mx-auto px-24 pt-24 pb-32">
      <div className="flex items-end justify-between border-b border-border-strong pb-8 mb-16">
        <div>
          <h1 className="text-[3rem] font-display italic leading-none mb-2">Live Session</h1>
          <p className="text-text-secondary text-lg font-mono">#{id}</p>
        </div>
        <div className="flex flex-col items-end gap-3 mb-2">
          <StreamStatusBadge status={status} />
          
          <div className="flex gap-2">
            {status === 'active' && (
              <button type="button" onClick={handlePause} disabled={!address || isActionLoading} className="px-3 py-1 text-xs border border-border-strong text-text-secondary rounded hover:bg-surface-dim hover:text-white transition-colors disabled:opacity-50">Pause</button>
            )}
            {status === 'paused' && (
              <button type="button" onClick={handleResume} disabled={!address || isActionLoading} className="px-3 py-1 text-xs border border-border-strong text-text-secondary rounded hover:bg-surface-dim hover:text-white transition-colors disabled:opacity-50">Resume</button>
            )}
            {status !== 'stopped' && (
              <button type="button" onClick={handleStop} disabled={!address || isActionLoading} className="px-3 py-1 text-xs border border-red-900/50 text-red-500 rounded hover:bg-red-900/20 transition-colors disabled:opacity-50">Stop</button>
            )}
          </div>
        </div>
      </div>

      <MagiConsensusEngine />

      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-3 space-y-8">
          <SalaryTicker accrued={accrued} ratePerSec={ratePerSec} status={status} />
          <CostBreakdown curatorRate={1000} platformFee={300} />
        </div>

        <div className="col-span-6 h-full min-h-[40rem]">
          <AgentWorkTimeline steps={steps} />
        </div>

        <div className="col-span-3 h-full max-h-[40rem]">
          <ProofHeartbeatTimeline proofs={proofs} />
        </div>
      </div>

      <div className="mt-16 border border-border-subtle bg-surface-elevated flex flex-col h-[36rem] rounded-xl overflow-hidden shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-border-subtle bg-surface">
          <p className="text-xs text-text-tertiary uppercase tracking-widest">
            Chat with Agent
          </p>
          <button type="button" onClick={() => setChatHistory([])} className="text-xs text-text-tertiary hover:text-text-primary transition-colors">
            Clear Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-surface-elevated">
          {chatHistory.length === 0 && (
            <p className="text-text-tertiary text-sm italic">Ask the agent anything about the current session...</p>
          )}
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-3 text-sm rounded-xl ${
                msg.role === 'user'
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'bg-surface-dim text-text-primary border border-border-strong'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-surface-dim text-text-tertiary border border-border-strong rounded-xl px-4 py-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-border-strong border-t-accent rounded-full animate-spin" />
                  Thinking...
                </span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>
        
        {toolActivity.length > 0 && (
          <div className="bg-surface-dim border-t border-border-subtle px-6 py-2">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span>Tools: {toolCallCount} calls</span>
              <div className="flex flex-wrap gap-1">
                {toolActivity.slice(-5).map((a) => (
                  <span key={a.id} className="bg-surface-elevated border border-border-subtle text-text-secondary px-1.5 py-0.5 rounded uppercase tracking-widest text-[10px]">{a.name}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 p-4 border-t border-border-subtle bg-surface">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) sendMessage() }}
            placeholder={!address ? "Connect wallet to chat" : "Ask the agent..."}
            disabled={chatLoading || !address}
            className="flex-1 bg-surface-dim border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent outline-none disabled:opacity-50 transition-colors"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={chatLoading || !chatInput.trim() || !address}
            className="bg-accent text-white font-bold px-6 py-2 rounded-xl text-xs uppercase tracking-widest hover:bg-accent/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>

      {status === 'stopped' && (
        <div className="mt-16 border border-border-subtle bg-surface-elevated">
          <div className="border-b border-border-subtle p-6 bg-surface-dim">
            <h3 className="font-display font-bold text-2xl text-text-primary">Final Settlement</h3>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border-subtle text-center">
            <div className="p-12">
              <div className="text-4xl font-display font-bold text-accent mb-2">${(accrued / 1_000_000).toFixed(4)}</div>
              <div className="text-text-secondary uppercase tracking-widest text-xs">Total Charged</div>
            </div>
            <div className="p-12">
              <div className="text-4xl font-display font-bold text-text-primary mb-2">${(accrued * 1000 / 1300 / 1_000_000).toFixed(4)}</div>
              <div className="text-text-secondary uppercase tracking-widest text-xs">Curator Payout</div>
            </div>
            <div className="p-12">
              <div className="text-4xl font-display font-bold text-text-primary mb-2">${(accrued * 300 / 1300 / 1_000_000).toFixed(4)}</div>
              <div className="text-text-secondary uppercase tracking-widest text-xs">Platform Fee</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
