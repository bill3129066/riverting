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
  const [accrued, setAccrued] = useState(0) // in USDC micro-units
  const [ratePerSec] = useState(1300) // 0.0013 USDC/sec in micro-units
  const eventSourceRef = useRef<EventSource | null>(null)

  // Optimistic local ticker
  useEffect(() => {
    if (status !== 'active') return
    const interval = setInterval(() => {
      setAccrued(prev => prev + ratePerSec)
    }, 1000)
    return () => clearInterval(interval)
  }, [status, ratePerSec])

  // SSE connection
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const connect = () => {
      const es = new EventSource(`${apiBase}/api/sessions/${id}/stream`)
      eventSourceRef.current = es

      es.addEventListener('step', (e) => {
        const step = JSON.parse(e.data)
        setSteps(prev => [...prev.slice(-50), step]) // keep last 50
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
        setTimeout(connect, 3000) // reconnect after 3s
      }
    }

    connect()
    return () => eventSourceRef.current?.close()
  }, [id])

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
      </div>
    </div>
  )
}
