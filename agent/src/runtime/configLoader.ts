import type { AgentSkillConfig } from '../types/index.js'

export async function loadSkillConfig(agentId: number, backendUrl: string): Promise<AgentSkillConfig> {
  const res = await fetch(`${backendUrl}/api/agents/${agentId}`)
  if (!res.ok) throw new Error(`Failed to load agent config: ${res.status}`)
  const agent = await res.json()

  const skillConfig = typeof agent.skill_config_json === 'string'
    ? JSON.parse(agent.skill_config_json)
    : agent.skill_config_json

  return {
    name: agent.name,
    description: agent.description,
    curator: agent.curator_wallet,
    category: agent.category,
    curatorRatePerSecond: agent.curator_rate_per_second,
    systemPrompt: skillConfig.systemPrompt || `You are ${agent.name}. ${agent.description}. Analyze DeFi data and provide clear, structured insights.`,
    model: skillConfig.model || 'gemini-2.0-flash',
    temperature: skillConfig.temperature || 0.3,
    tools: skillConfig.tools || [],
    analysisTemplates: skillConfig.analysisTemplates || ['pool-snapshot'],
    maxSessionDuration: skillConfig.maxSessionDuration || 3600,
  }
}
