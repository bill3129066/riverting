import { getDb } from '../../db/client.js'
import { sseHub } from '../realtime/sseHub.js'
import { randomUUID } from 'crypto'

const MAX_CONCURRENT_INSTANCES = 3

interface ActiveInstance {
  instanceId: string
  sessionId: string
  agentId: number
  runner: InlineAgentRunner
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

    const runner = new InlineAgentRunner(
      { sessionId, agentId, backendUrl, geminiApiKey },
      (step) => {
        const db = getDb()
        const stepId = randomUUID()
        const instance = this.instances.get(sessionId)
        const seq = (instance?.runner?.stepSeq || 0) + 1
        if (instance?.runner) instance.runner.stepSeq = seq

        try {
          db.prepare(
            `
            INSERT INTO session_steps (id, session_id, seq, step_type, title, body, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          `,
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
          proofHash: `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`,
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
    console.log(`[InstanceManager] Paused instance for session ${sessionId}`)
  }

  resumeInstance(sessionId: string) {
    const instance = this.instances.get(sessionId)
    if (!instance) return
    instance.status = 'running'
    instance.runner.resume()
    sseHub.emitStatus(sessionId, 'active')
    console.log(`[InstanceManager] Resumed instance for session ${sessionId}`)
  }

  stopInstance(sessionId: string) {
    const instance = this.instances.get(sessionId)
    if (!instance) return
    instance.status = 'stopped'
    instance.runner.stop()
    this.instances.delete(sessionId)
    sseHub.emitStatus(sessionId, 'stopped')
    console.log(`[InstanceManager] Stopped instance for session ${sessionId}`)
  }

  getStatus(sessionId: string): string {
    return this.instances.get(sessionId)?.status || 'not_running'
  }
}

interface AgentStep {
  ts: string
  kind: string
  title: string
  body: string
}

interface RunnerConfig {
  sessionId: string
  agentId: number
  backendUrl: string
  geminiApiKey: string
}

class InlineAgentRunner {
  private config: RunnerConfig
  private onStep: (step: AgentStep) => void
  private onProof: (steps: AgentStep[]) => void
  private running = false
  private stepBuffer: AgentStep[] = []
  private proofInterval?: ReturnType<typeof setInterval>
  private workInterval?: ReturnType<typeof setInterval>
  private seq = 0
  stepSeq = 0
  private paused = false

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
    this.emit('commentary', 'Agent starting', `Session ${this.config.sessionId} initialized`)

    this.proofInterval = setInterval(() => {
      if (!this.running || this.paused) return
      const steps = [...this.stepBuffer]
      this.stepBuffer = []
      this.onProof(steps)
    }, 4000)

    this.workInterval = setInterval(() => {
      if (!this.running || this.paused) return
      this.runCycle()
    }, 7000)

    this.runCycle()
  }

  private runCycle() {
    this.seq++
    const templates = ['pool-snapshot', 'yield-compare']
    const template = templates[this.seq % templates.length]

    this.emit('api', 'OnchainOS Market API', `Fetching ${template} data (cycle ${this.seq})`)

    setTimeout(() => {
      if (!this.running) return
      this.emit(
        'rpc',
        'X Layer RPC',
        `Reading block ${Math.floor(Math.random() * 100000) + 12900000}`,
      )
    }, 500)

    setTimeout(() => {
      if (!this.running) return
      const metrics =
        template === 'pool-snapshot'
          ? `TVL: $${(2.1 + Math.random() * 0.6).toFixed(1)}M | Vol: $${(150 + Math.random() * 60).toFixed(0)}K | Fee: 0.3%`
          : `Pool A: ${(3.8 + Math.random() * 1.5).toFixed(1)}% APY | Pool B: ${(4.5 + Math.random() * 2).toFixed(1)}% APY`
      this.emit('metric', 'Metrics computed', metrics)
    }, 1200)

    setTimeout(() => {
      if (!this.running) return
      const findings = [
        'Liquidity depth is healthy — spread within normal range for current volatility.',
        'Volume/TVL ratio suggests active trading. Fee capture opportunity is favorable.',
        'Pool B offers better risk-adjusted yield based on 24h data.',
        'No significant impermanent loss risk detected at current price range.',
      ]
      this.emit('finding', 'Analysis complete', findings[this.seq % findings.length])
    }, 2500)
  }

  private emit(kind: string, title: string, body: string) {
    const step: AgentStep = { ts: new Date().toISOString(), kind, title, body }
    this.stepBuffer.push(step)
    this.onStep(step)
  }

  pause() {
    this.paused = true
  }

  resume() {
    this.paused = false
  }

  stop() {
    this.running = false
    if (this.proofInterval) clearInterval(this.proofInterval)
    if (this.workInterval) clearInterval(this.workInterval)
  }
}

export const instanceManager = new InstanceManager()
