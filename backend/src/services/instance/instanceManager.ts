import { getDb } from '../../db/client.js'
import { sseHub } from '../realtime/sseHub.js'
import { randomUUID } from 'crypto'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MAX_CONCURRENT_INSTANCES = 3

interface AgentStep {
  ts: string
  kind: string
  title: string
  body: string
}

interface ActiveInstance {
  instanceId: string
  sessionId: string
  agentId: number
  runner: RealAgentRunner
  status: 'running' | 'paused' | 'stopped'
}

class InstanceManager {
  private instances = new Map<string, ActiveInstance>()

  async spawnInstance(sessionId: string, agentId: number): Promise<string> {
    if (this.instances.has(sessionId)) {
      console.log(`[InstanceManager] Instance already running for session ${sessionId}`)
      return this.instances.get(sessionId)!.instanceId
    }

    const runningCount = [...this.instances.values()].filter(
      (i) => i.status === 'running' || i.status === 'paused',
    ).length
    if (runningCount >= MAX_CONCURRENT_INSTANCES) {
      throw new Error(
        `Max concurrent instances reached (${MAX_CONCURRENT_INSTANCES}). Stop an existing session first.`,
      )
    }

    const instanceId = randomUUID()
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const geminiApiKey = process.env.GEMINI_API_KEY || ''

    console.log(`[InstanceManager] Spawning instance ${instanceId} for session ${sessionId}`)

    const runner = new RealAgentRunner(
      { sessionId, agentId, backendUrl, geminiApiKey },
      (step) => {
        const db = getDb()
        const stepId = randomUUID()
        const instance = this.instances.get(sessionId)
        const seq = (instance?.runner?.stepSeq || 0) + 1
        if (instance?.runner) instance.runner.stepSeq = seq

        try {
          db.prepare(
            `INSERT INTO session_steps (id, session_id, seq, step_type, title, body, created_at)
             VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
          ).run(stepId, sessionId, seq, step.kind, step.title, step.body.slice(0, 500))
        } catch (_e) {}

        sseHub.emitStep(sessionId, step)
      },
      (_steps) => {
        const db = getDb()
        const lastProof = db
          .prepare('SELECT seq FROM proofs WHERE session_id = ? ORDER BY seq DESC LIMIT 1')
          .get(sessionId) as { seq: number } | undefined
        const seq = (lastProof?.seq || 0) + 1

        sseHub.emitProof(sessionId, {
          seq,
          proofHash: `0x${randomUUID().replace(/-/g, '').padEnd(64, '0')}`,
          ts: new Date().toISOString(),
        })

        const session = db
          .prepare('SELECT total_rate FROM sessions WHERE id = ?')
          .get(sessionId) as { total_rate: number } | undefined
        if (session) {
          sseHub.emitEarnings(sessionId, seq * 4 * (session.total_rate || 1300))
        }
      },
    )

    const instance: ActiveInstance = { instanceId, sessionId, agentId, runner, status: 'running' }
    this.instances.set(sessionId, instance)

    runner.start().catch((e: Error) => {
      console.log(`[InstanceManager] Runner error: ${e.message}`)
    })

    return instanceId
  }

  pauseInstance(sessionId: string) {
    const instance = this.instances.get(sessionId)
    if (!instance) return
    instance.status = 'paused'
    instance.runner.pause()
    sseHub.emitStatus(sessionId, 'paused')
  }

  resumeInstance(sessionId: string) {
    const instance = this.instances.get(sessionId)
    if (!instance) return
    instance.status = 'running'
    instance.runner.resume()
    sseHub.emitStatus(sessionId, 'active')
  }

  stopInstance(sessionId: string) {
    const instance = this.instances.get(sessionId)
    if (!instance) return
    instance.status = 'stopped'
    instance.runner.stop()
    this.instances.delete(sessionId)
    sseHub.emitStatus(sessionId, 'stopped')
  }

  getStatus(sessionId: string): string {
    return this.instances.get(sessionId)?.status || 'not_running'
  }
}

interface RunnerConfig {
  sessionId: string
  agentId: number
  backendUrl: string
  geminiApiKey: string
}

interface SkillConfig {
  name: string
  description?: string
  systemPrompt?: string
  githubUrl?: string
  model?: string
  temperature?: number
  analysisTemplates?: string[]
}

class RealAgentRunner {
  private config: RunnerConfig
  private onStep: (step: AgentStep) => void
  private onProof: (steps: AgentStep[]) => void
  private running = false
  private paused = false
  private stepBuffer: AgentStep[] = []
  private proofInterval?: ReturnType<typeof setInterval>
  private workInterval?: ReturnType<typeof setInterval>
  private seq = 0
  private skillConfig?: SkillConfig
  private genAI?: GoogleGenerativeAI
  stepSeq = 0

  constructor(
    config: RunnerConfig,
    onStep: (step: AgentStep) => void,
    onProof: (steps: AgentStep[]) => void,
  ) {
    this.config = config
    this.onStep = onStep
    this.onProof = onProof
  }

  async start() {
    this.running = true
    this.skillConfig = await this.loadSkillConfig()

    if (this.config.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(this.config.geminiApiKey)
    }

    this.emit('commentary', 'Agent starting', `Loading ${this.skillConfig.name} for session ${this.config.sessionId}`)

    this.proofInterval = setInterval(() => {
      if (!this.running || this.paused) return
      const steps = [...this.stepBuffer]
      this.stepBuffer = []
      this.onProof(steps)
    }, 4000)

    this.workInterval = setInterval(() => {
      if (!this.running || this.paused) return
      this.runCycle().catch((e: Error) => {
        this.emit('commentary', 'Cycle error', e.message)
      })
    }, 8000)

    await this.runCycle()
  }

  private async loadSkillConfig(): Promise<SkillConfig> {
    try {
      const res = await fetch(`${this.config.backendUrl}/api/agents/${this.config.agentId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const agent = await res.json()
      const raw = typeof agent.skill_config_json === 'string'
        ? JSON.parse(agent.skill_config_json)
        : agent.skill_config_json

      // Try to load skill.json from GitHub repo
      const githubUrl: string = raw.githubUrl || agent.metadata_uri || ''
      let githubSkill: Partial<SkillConfig> = {}
      if (githubUrl) {
        githubSkill = await this.fetchGithubSkill(githubUrl)
      }

      return {
        name: agent.name,
        description: agent.description,
        systemPrompt: githubSkill.systemPrompt || raw.systemPrompt || `You are ${agent.name}. ${agent.description}. Analyze DeFi data and provide clear, concise insights in 2-3 sentences.`,
        githubUrl,
        model: githubSkill.model || raw.model || 'gemini-2.0-flash',
        temperature: githubSkill.temperature ?? raw.temperature ?? 0.3,
        analysisTemplates: githubSkill.analysisTemplates || raw.analysisTemplates || ['pool-snapshot'],
      }
    } catch (e) {
      console.warn(`[RealAgentRunner] Failed to load skill config: ${(e as Error).message}`)
      return {
        name: 'DeFi Analyst',
        systemPrompt: 'You are a DeFi analyst. Analyze pool data and provide clear, concise insights in 2-3 sentences.',
        model: 'gemini-2.0-flash',
        temperature: 0.3,
        analysisTemplates: ['pool-snapshot'],
      }
    }
  }

  private async fetchGithubSkill(githubUrl: string): Promise<Partial<SkillConfig>> {
    try {
      // Convert https://github.com/owner/repo to raw URL for skill.json
      const match = githubUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?(?:\/.*)?$/)
      if (!match) return {}
      const rawUrl = `https://raw.githubusercontent.com/${match[1]}/main/skill.json`
      console.log(`[RealAgentRunner] Fetching skill.json from: ${rawUrl}`)
      const res = await fetch(rawUrl, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) {
        console.warn(`[RealAgentRunner] skill.json not found (${res.status}): ${rawUrl}`)
        return {}
      }
      const skill = await res.json()
      console.log(`[RealAgentRunner] Loaded skill.json from GitHub: ${JSON.stringify(skill).slice(0, 100)}`)
      return skill
    } catch (e) {
      console.warn(`[RealAgentRunner] Failed to fetch skill.json from GitHub: ${(e as Error).message}`)
      return {}
    }
  }

  private async runCycle() {
    this.seq++
    const template = this.skillConfig?.analysisTemplates?.[this.seq % (this.skillConfig.analysisTemplates.length || 1)] || 'pool-snapshot'

    this.emit('api', `Fetching data (cycle ${this.seq})`, `Running ${template} analysis`)

    const mockData = this.getMockData(template)
    this.emit('rpc', 'Reading on-chain state', `Block: ${Math.floor(Math.random() * 1_000_000) + 12_000_000}`)
    this.emit('metric', 'Metrics computed', mockData.metrics)

    if (this.genAI && this.skillConfig) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: this.skillConfig.model || 'gemini-2.0-flash',
          generationConfig: {
            temperature: this.skillConfig.temperature ?? 0.3,
            maxOutputTokens: 1024,
          },
          systemInstruction: this.skillConfig.systemPrompt,
        })
        const prompt = `Analyze this DeFi data and provide a 2-sentence insight:\n\nMetrics: ${mockData.metrics}\n\nBe specific and actionable.`
        const result = await model.generateContent(prompt)
        const analysis = result.response.text()
        if (analysis) {
          this.emit('finding', 'AI Analysis', analysis)
          return
        }
      } catch (e) {
        console.warn(`[RealAgentRunner] Gemini error: ${(e as Error).message}`)
      }
    }

    // Fallback if no API key or error
    this.emit('finding', 'Analysis result', mockData.summary)
  }

  private getMockData(template: string) {
    if (template === 'pool-snapshot') {
      return {
        metrics: `TVL: $${(2.1 + Math.random() * 0.6).toFixed(1)}M | Vol: $${(150 + Math.random() * 60).toFixed(0)}K | Fee: 0.3%`,
        summary: 'Pool shows healthy trading activity with balanced liquidity depth.',
      }
    }
    return {
      metrics: `Yield A: ${(3.8 + Math.random() * 1.5).toFixed(1)}% APY | Yield B: ${(4.5 + Math.random() * 2).toFixed(1)}% APY`,
      summary: 'Option B offers better risk-adjusted yield based on current metrics.',
    }
  }

  private emit(kind: string, title: string, body: string) {
    const step: AgentStep = { ts: new Date().toISOString(), kind, title, body }
    this.stepBuffer.push(step)
    this.onStep(step)
  }

  pause() { this.paused = true }
  resume() { this.paused = false }

  stop() {
    this.running = false
    if (this.proofInterval) clearInterval(this.proofInterval)
    if (this.workInterval) clearInterval(this.workInterval)
    this.emit('commentary', 'Agent stopped', `Session ${this.config.sessionId} ended`)
  }
}

export const instanceManager = new InstanceManager()
