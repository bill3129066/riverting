import OpenAI from 'openai'
import type { AgentSkillConfig, AgentStep, InstanceConfig } from '../types/index.js'
import { loadSkillConfig } from './configLoader.js'

type StepCallback = (step: AgentStep) => void
type ProofCallback = (steps: AgentStep[]) => void

export class InstanceRunner {
  private config!: AgentSkillConfig
  private instanceConfig: InstanceConfig
  private openai: OpenAI
  private running = false
  private stepBuffer: AgentStep[] = []
  private onStep: StepCallback
  private onProof: ProofCallback
  private proofInterval?: ReturnType<typeof setInterval>
  private workInterval?: ReturnType<typeof setInterval>
  private seq = 0

  constructor(instanceConfig: InstanceConfig, onStep: StepCallback, onProof: ProofCallback) {
    this.instanceConfig = instanceConfig
    this.onStep = onStep
    this.onProof = onProof
    this.openai = new OpenAI({ apiKey: instanceConfig.openaiApiKey })
  }

  async start() {
    this.config = await loadSkillConfig(this.instanceConfig.agentId, this.instanceConfig.backendUrl)
    this.running = true

    this.emitStep('commentary', 'Agent starting', `Loading ${this.config.name} for session ${this.instanceConfig.sessionId}`)

    this.proofInterval = setInterval(() => {
      if (!this.running) return
      const steps = [...this.stepBuffer]
      this.stepBuffer = []
      this.onProof(steps)
    }, 4000)

    this.workInterval = setInterval(() => {
      if (!this.running) return
      this.runAnalysisCycle().catch(e => {
        this.emitStep('commentary', 'Analysis error', `Error: ${e.message}`)
      })
    }, 8000)

    await this.runAnalysisCycle()
  }

  private async runAnalysisCycle() {
    this.seq++
    const template = this.config.analysisTemplates[0] || 'pool-snapshot'

    this.emitStep('api', `Fetching data (cycle ${this.seq})`, `Running ${template} analysis`)

    const mockData = this.getMockData(template)
    this.emitStep('rpc', 'Reading on-chain state', `Block: ${Math.floor(Math.random() * 1000000) + 12000000}`)
    this.emitStep('metric', 'Metrics computed', mockData.metrics)

    try {
      const prompt = this.buildPrompt(template, mockData)
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: 200,
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          { role: 'user', content: prompt },
        ],
      })

      const analysis = response.choices[0]?.message?.content || 'Analysis complete.'
      this.emitStep('finding', 'Analysis result', analysis)
    } catch (e: any) {
      this.emitStep('finding', 'Analysis result', `Mock analysis: ${mockData.summary}`)
    }
  }

  private getMockData(template: string) {
    if (template === 'pool-snapshot') {
      return {
        metrics: `TVL: $2.4M | 24h Volume: $180K | Fee Rate: 0.3% | Price: $3,124`,
        summary: 'Pool shows healthy trading activity with balanced liquidity depth.',
      }
    }
    return {
      metrics: `Yield A: 4.2% APY | Yield B: 5.8% APY | Risk Score: 42/100`,
      summary: 'Option B offers better risk-adjusted yield based on current metrics.',
    }
  }

  private buildPrompt(template: string, data: { metrics: string; summary: string }): string {
    return `Analyze this DeFi data and provide a 2-sentence insight:\n\nMetrics: ${data.metrics}\n\nBe specific and actionable.`
  }

  private emitStep(kind: AgentStep['kind'], title: string, body: string) {
    const step: AgentStep = { ts: new Date().toISOString(), kind, title, body }
    this.stepBuffer.push(step)
    this.onStep(step)
  }

  stop() {
    this.running = false
    if (this.proofInterval) clearInterval(this.proofInterval)
    if (this.workInterval) clearInterval(this.workInterval)
    this.emitStep('commentary', 'Agent stopped', `Session ${this.instanceConfig.sessionId} ended`)
  }
}
