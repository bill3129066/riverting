'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchSessions } from '@/lib/api'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#00d4aa]/10 text-[#00d4aa]',
  paused: 'bg-yellow-900/30 text-yellow-400',
  stopped: 'bg-[#333] text-[#666]',
}

function formatCost(microUnits: number) {
  return `$${(microUnits / 1_000_000).toFixed(4)}`
}

function formatDuration(createdAt: string, endedAt: string | null) {
  const start = new Date(createdAt).getTime()
  const end = endedAt ? new Date(endedAt).getTime() : Date.now()
  const secs = Math.floor((end - start) / 1000)
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${secs % 60}s`
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Sessions</h1>
            <p className="text-[#666] text-sm mt-1">所有已啟動的 Agent 工作紀錄</p>
          </div>
          <Link
            href="/marketplace"
            className="bg-[#00d4aa] text-black font-bold px-5 py-2.5 rounded-xl hover:bg-[#00b894] transition-colors text-sm"
          >
            + Start New Session
          </Link>
        </div>

        {loading ? (
          <p className="text-[#666]">Loading...</p>
        ) : sessions.length === 0 ? (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-10 text-center">
            <p className="text-[#666] mb-4">還沒有任何 Session</p>
            <Link href="/marketplace" className="text-[#00d4aa] hover:underline text-sm">
              前往 Marketplace 啟動第一個 Agent →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/session/${s.id}`}
                className="block bg-[#111] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#00d4aa]/30 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status] ?? STATUS_STYLES.stopped}`}>
                        {s.status}
                      </span>
                      <span className="text-xs text-[#555] font-mono">#{s.id.slice(0, 8)}</span>
                    </div>
                    <p className="font-semibold">Agent #{s.agent_id}</p>
                    <p className="text-xs text-[#555]">
                      {new Date(s.created_at).toLocaleString()} · {formatDuration(s.created_at, s.ended_at)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[#00d4aa] font-bold">{formatCost(s.total_rate * 4)}</p>
                    <p className="text-xs text-[#555]">{formatCost(s.total_rate)}/sec</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
