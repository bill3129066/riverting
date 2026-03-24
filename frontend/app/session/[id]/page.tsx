'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import SalaryTicker from '@/components/session/SalaryTicker'
import ProofHeartbeatTimeline from '@/components/session/ProofHeartbeatTimeline'
import AgentWorkTimeline from '@/components/session/AgentWorkTimeline'
import StreamStatusBadge from '@/components/session/StreamStatusBadge'
import CostBreakdown from '@/components/session/CostBreakdown'

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
