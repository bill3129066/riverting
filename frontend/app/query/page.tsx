'use client'
import { useState, useEffect } from 'react'
import { fetchAgents } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const QUERY_TYPES = [
  { id: 'summary', label: 'Analysis Summary', price: '$0.001', description: 'Brief overview of recent analysis' },
  { id: 'ask', label: 'Ask a Question', price: '$0.003', description: 'Ask the agent a specific question' },
  { id: 'evidence', label: 'Full Evidence', price: '$0.005', description: 'Complete proof package with all data' },
]

export default function QueryPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [selectedAgent, setSelectedAgent] = useState<number>(1)
  const [queryType, setQueryType] = useState('summary')
  const [question, setQuestion] = useState('')
  const [state, setState] = useState<'idle' | 'requires-payment' | 'paying' | 'paid' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)

  useEffect(() => {
    fetchAgents().then(setAgents).catch(console.error)
  }, [])

  const handleQuery = async () => {
    setState('requires-payment')
    
    const url = `${API_BASE}/queries/agent/${selectedAgent}/${queryType}`
    const res = await fetch(url, {
      method: queryType === 'ask' ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: queryType === 'ask' ? JSON.stringify({ question }) : undefined,
    })
    
    if (res.status === 402) {
      const data = await res.json()
      setPaymentInfo(data)
      setState('requires-payment')
    } else if (res.ok) {
      setResult(await res.json())
      setState('paid')
    }
  }

  const handlePay = async () => {
    setState('paying')
    
    await new Promise(r => setTimeout(r, 1500))
    
    const url = `${API_BASE}/queries/agent/${selectedAgent}/${queryType}`
    try {
      const res = await fetch(url, {
        method: queryType === 'ask' ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Payment': `mock-payment-${Date.now()}`,
        },
        body: queryType === 'ask' ? JSON.stringify({ question }) : undefined,
      })
      
      if (res.ok) {
        setResult(await res.json())
        setState('paid')
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  const selectedQueryType = QUERY_TYPES.find(q => q.id === queryType)!
  const selectedAgentData = agents.find(a => a.id === selectedAgent)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Spot Query</h1>
        <p className="text-[#666] mb-8">Pay per query via x402. No subscription needed.</p>

        <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 mb-4">
          <label htmlFor="agent-select" className="block text-sm text-[#888] mb-2">Select Agent</label>
          <select
            id="agent-select"
            value={selectedAgent}
            onChange={e => setSelectedAgent(parseInt(e.target.value))}
            className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white outline-none focus:border-[#00d4aa]"
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {QUERY_TYPES.map(qt => (
            <button
              key={qt.id}
              type="button"
              onClick={() => { setQueryType(qt.id); setState('idle'); setResult(null) }}
              className={`p-4 rounded-xl border text-left transition-all ${
                queryType === qt.id
                  ? 'border-[#00d4aa] bg-[#00d4aa]/5'
                  : 'border-[#1a1a1a] bg-[#111] hover:border-[#333]'
              }`}
            >
              <div className="font-semibold text-sm">{qt.label}</div>
              <div className="text-[#00d4aa] font-bold mt-1">{qt.price}</div>
              <div className="text-[#555] text-xs mt-1">{qt.description}</div>
            </button>
          ))}
        </div>

        {queryType === 'ask' && (
          <div className="mb-4">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask the agent a question..."
              className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:border-[#00d4aa] outline-none"
            />
          </div>
        )}

        {state === 'idle' && (
          <button
            type="button"
            onClick={handleQuery}
            className="w-full bg-[#00d4aa] text-black font-bold py-3.5 rounded-xl hover:bg-[#00b894] transition-colors"
          >
            Query for {selectedQueryType.price} →
          </button>
        )}

        {state === 'requires-payment' && paymentInfo && (
          <div className="bg-[#111] border border-[#00d4aa]/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="font-semibold">Payment Required</span>
            </div>
            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-[#666]">Amount</span>
                <span className="font-bold text-[#00d4aa]">{selectedQueryType.price} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666]">Network</span>
                <span>X Layer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666]">Protocol</span>
                <span>x402</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePay}
              className="w-full bg-[#00d4aa] text-black font-bold py-3 rounded-xl hover:bg-[#00b894] transition-colors"
            >
              Pay {selectedQueryType.price} USDC →
            </button>
          </div>
        )}

        {state === 'paying' && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6 text-center">
            <div className="w-8 h-8 border-2 border-[#00d4aa] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[#888]">Processing payment on X Layer...</p>
          </div>
        )}

        {state === 'paid' && result && (
          <div className="bg-[#111] border border-[#00d4aa]/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-[#00d4aa]" />
              <span className="font-semibold text-[#00d4aa]">Payment Confirmed — Analysis Unlocked</span>
            </div>
            
            {result.summary && (
              <p className="text-[#ccc] mb-4">{result.summary}</p>
            )}
            {result.answer && (
              <div>
                <p className="text-[#666] text-xs mb-1">Question: {result.question}</p>
                <p className="text-[#ccc]">{result.answer}</p>
              </div>
            )}
            {result.proofs && (
              <div>
                <p className="text-[#666] text-sm mb-2">{result.proofCount} proof records found</p>
                {result.proofs.slice(0, 3).map((p: any) => (
                  <div key={p.seq || p.proofHash || Math.random()} className="text-xs font-mono text-[#555] mb-1">
                    #{p.seq} {p.proofHash?.slice(0, 20)}...
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex justify-between text-xs text-[#555]">
              <span>Paid: {result.pricePaid}</span>
              <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
            </div>
            
            <button
              type="button"
              onClick={() => { setState('idle'); setResult(null); setPaymentInfo(null) }}
              className="mt-4 w-full border border-[#222] text-[#666] py-2 rounded-xl hover:border-[#333] transition-colors text-sm"
            >
              Query Again
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            Query failed. Please try again.
            <button type="button" onClick={() => setState('idle')} className="ml-3 underline">Reset</button>
          </div>
        )}
      </div>
    </div>
  )
}
