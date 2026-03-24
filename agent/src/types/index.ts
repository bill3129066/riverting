export interface AgentSkillConfig {
  name: string
  description: string
  curator: string
  category: string
  curatorRatePerSecond: number
  systemPrompt: string
  model: string
  temperature: number
  tools: Array<{ type: string; description: string }>
  analysisTemplates: string[]
  maxSessionDuration: number
}

export interface AgentStep {
  ts: string
  kind: 'api' | 'rpc' | 'metric' | 'commentary' | 'finding'
  title: string
  body: string
  metadata?: Record<string, unknown>
}

export interface InstanceConfig {
  sessionId: string
  agentId: number
  backendUrl: string
  openaiApiKey: string
  target?: string
}
