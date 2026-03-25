import type { SignedHeaders } from './sign-action'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// --- Billing ---

export async function fetchBalance(wallet: string): Promise<{ wallet: string; balance: number; total_deposited: number; total_spent: number }> {
  const res = await fetch(`${API_BASE}/api/skills/billing/balance?wallet=${wallet}`)
  if (!res.ok) throw new Error('Failed to fetch balance')
  return res.json()
}

export async function depositFunds(amount: number, auth: SignedHeaders) {
  const res = await fetch(`${API_BASE}/api/skills/billing/deposit`, {
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

// --- Rating ---

export async function rateSkill(id: string, rating: number, auth: SignedHeaders) {
  const res = await fetch(`${API_BASE}/api/skills/${id}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ rating }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to rate skill')
  }
  return res.json()
}

export async function fetchUserRating(id: string, wallet: string): Promise<number | null> {
  const res = await fetch(`${API_BASE}/api/skills/${id}/rating?wallet=${wallet}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.rating
}

export async function fetchSkillStats(id: string) {
  const res = await fetch(`${API_BASE}/api/skills/${id}/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

// --- Compression ---

export async function compressSkillContent(content: string, type: 'skill' | 'pattern' = 'skill'): Promise<{ original: number; compressed: number; ratio: string; content: string }> {
  const res = await fetch(`${API_BASE}/api/skills/compress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, type }),
  })
  if (!res.ok) throw new Error('Failed to compress')
  return res.json()
}

// --- Public read routes (no auth) ---

export async function fetchSkills(params?: { category?: string; q?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.category && params.category !== 'all') searchParams.set('category', params.category)
  if (params?.q) searchParams.set('q', params.q)
  const qs = searchParams.toString()
  const res = await fetch(`${API_BASE}/api/skills${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to fetch skills')
  return res.json()
}

export async function fetchSkill(id: string) {
  const res = await fetch(`${API_BASE}/api/skills/${id}`)
  if (!res.ok) throw new Error('Failed to fetch skill')
  return res.json()
}

export async function fetchSkillExecutions(id: string, wallet?: string) {
  const params = wallet ? `?wallet=${wallet}` : ''
  const res = await fetch(`${API_BASE}/api/skills/${id}/executions${params}`)
  if (!res.ok) throw new Error('Failed to fetch executions')
  return res.json()
}

// --- Authenticated write routes (signature required) ---

export async function createSkill(data: Record<string, unknown>, auth: SignedHeaders) {
  const res = await fetch(`${API_BASE}/api/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create skill')
  }
  return res.json()
}

export async function runSkill(id: string, inputs: Record<string, unknown>, auth: SignedHeaders) {
  const res = await fetch(`${API_BASE}/api/skills/${id}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ inputs }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to run skill')
  }
  return res.json()
}

export async function runSkillStream(
  id: string,
  inputs: Record<string, unknown>,
  auth: SignedHeaders,
  onChunk: (text: string) => void,
  onComplete: (stats: { executionId: string; durationMs: number; tokensUsed: number | null; toolCallCount?: number }) => void,
  onError: (error: string) => void,
  onToolUse?: (calls: Array<{ name: string; args: unknown }>) => void,
  onToolResult?: (results: Array<{ name: string; hasError: boolean }>, totalCalls: number) => void,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/skills/${id}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ inputs }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to start stream')
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    let currentEvent = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7)
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        if (currentEvent === 'chunk') onChunk(data.text)
        else if (currentEvent === 'complete') onComplete(data)
        else if (currentEvent === 'error') onError(data.error)
        else if (currentEvent === 'tool_use' && onToolUse) onToolUse(data.calls)
        else if (currentEvent === 'tool_result' && onToolResult) onToolResult(data.results, data.totalCalls)
      }
    }
  }
}

// --- Chat mode ---

export async function chatWithSkill(
  id: string,
  message: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  inputs: Record<string, unknown>,
  auth?: SignedHeaders,
): Promise<{ reply: string; tokensUsed: number | null; toolCallCount: number }> {
  const endpoint = auth ? `${API_BASE}/api/skills/${id}/chat` : `${API_BASE}/api/skills/${id}/chat-demo`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(auth || {}) },
    body: JSON.stringify({ message, history, inputs }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to chat with skill')
  }
  return res.json()
}

// --- Delete ---

export async function deleteSkill(id: string, auth: SignedHeaders) {
  const res = await fetch(`${API_BASE}/api/skills/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...auth },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to delete skill')
  }
  return res.json()
}
