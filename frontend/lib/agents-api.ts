const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type AuthHeaders = { 'x-wallet-address': string; 'x-signature': string; 'x-timestamp': string }

// Agent CRUD
export async function fetchAgents(params?: { category?: string; q?: string; creator?: string }): Promise<any[]> {
  const searchParams = new URLSearchParams()
  if (params?.category && params.category !== 'all') searchParams.set('category', params.category)
  if (params?.q) searchParams.set('q', params.q)
  if (params?.creator) searchParams.set('creator', params.creator)
  const qs = searchParams.toString()
  const res = await fetch(`${API}/api/agents${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to fetch agents')
  return res.json()
}

export async function fetchAgent(id: string): Promise<any> {
  const res = await fetch(`${API}/api/agents/${id}`)
  if (!res.ok) throw new Error('Failed to fetch agent')
  return res.json()
}

export async function createAgent(data: any, auth: AuthHeaders): Promise<any> {
  const res = await fetch(`${API}/api/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create agent')
  }
  return res.json()
}

export async function deleteAgent(id: string, auth: AuthHeaders): Promise<void> {
  const res = await fetch(`${API}/api/agents/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...auth },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to delete agent')
  }
}

export async function rateAgent(id: string, rating: number, auth: AuthHeaders): Promise<{ avg_rating: number }> {
  const res = await fetch(`${API}/api/agents/${id}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ rating }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to rate agent')
  }
  return res.json()
}

export async function fetchUserRating(id: string, wallet: string): Promise<number | null> {
  const res = await fetch(`${API}/api/agents/${id}/rating?wallet=${wallet}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.rating
}

export async function fetchAgentStats(id: string): Promise<any> {
  const res = await fetch(`${API}/api/agents/${id}/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function fetchAgentExecutions(id: string, wallet?: string): Promise<any[]> {
  const params = wallet ? `?wallet=${wallet}` : ''
  const res = await fetch(`${API}/api/agents/${id}/executions${params}`)
  if (!res.ok) throw new Error('Failed to fetch executions')
  return res.json()
}

// Billing
export async function fetchBalance(wallet: string): Promise<{ balance: number }> {
  const res = await fetch(`${API}/api/agents/billing/balance?wallet=${wallet}`)
  if (!res.ok) throw new Error('Failed to fetch balance')
  return res.json()
}

export async function depositFunds(amount: number, auth: AuthHeaders): Promise<{ balance: number }> {
  const res = await fetch(`${API}/api/agents/billing/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ amount }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to deposit')
  }
  return res.json()
}

// Compression
export async function compressContent(content: string, type: string): Promise<any> {
  const res = await fetch(`${API}/api/agents/compress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, type }),
  })
  if (!res.ok) throw new Error('Failed to compress')
  return res.json()
}

// Sessions
export async function createSession(agentId: string, inputs: Record<string, string>, auth: AuthHeaders): Promise<{ id: string }> {
  const res = await fetch(`${API}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ agentId, inputs }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create session')
  }
  return res.json()
}

export async function chatInSession(sessionId: string, message: string, history: any[], auth: AuthHeaders): Promise<{ reply: string; toolCallCount: number }> {
  const res = await fetch(`${API}/api/sessions/${sessionId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ message, history }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to chat in session')
  }
  return res.json()
}

export async function pauseSession(id: string, auth: AuthHeaders): Promise<void> {
  const res = await fetch(`${API}/api/sessions/${id}/pause`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to pause session')
  }
}

export async function resumeSession(id: string, auth: AuthHeaders): Promise<void> {
  const res = await fetch(`${API}/api/sessions/${id}/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to resume session')
  }
}

export async function stopSession(id: string, auth: AuthHeaders): Promise<void> {
  const res = await fetch(`${API}/api/sessions/${id}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to stop session')
  }
}

export async function fetchSessions(wallet: string): Promise<any[]> {
  const res = await fetch(`${API}/api/sessions?wallet=${wallet}`)
  if (!res.ok) throw new Error('Failed to fetch sessions')
  return res.json()
}
