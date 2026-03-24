const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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

export async function createSkill(data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/skills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create skill')
  }
  return res.json()
}

export async function runSkill(id: string, userWallet: string, inputs: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/skills/${id}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userWallet, inputs }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to run skill')
  }
  return res.json()
}

export async function fetchSkillExecutions(id: string) {
  const res = await fetch(`${API_BASE}/api/skills/${id}/executions`)
  if (!res.ok) throw new Error('Failed to fetch executions')
  return res.json()
}

export async function deleteSkill(id: string, creatorWallet: string) {
  const res = await fetch(`${API_BASE}/api/skills/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creatorWallet }),
  })
  if (!res.ok) throw new Error('Failed to delete skill')
  return res.json()
}
