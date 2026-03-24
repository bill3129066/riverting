const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function fetchAgents() {
  const res = await fetch(`${API_BASE}/api/agents`)
  if (!res.ok) throw new Error('Failed to fetch agents')
  return res.json()
}

export async function fetchAgent(id: string) {
  const res = await fetch(`${API_BASE}/api/agents/${id}`)
  if (!res.ok) throw new Error('Failed to fetch agent')
  return res.json()
}
