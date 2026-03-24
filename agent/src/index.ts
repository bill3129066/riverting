import { InstanceRunner } from './runtime/instanceRunner.js'

const sessionId = process.env.SESSION_ID || 'test-session'
const agentId = parseInt(process.env.AGENT_ID || '1')
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
const openaiApiKey = process.env.OPENAI_API_KEY || 'mock-key'

console.log(`Starting agent instance for session ${sessionId}, agent ${agentId}`)

const runner = new InstanceRunner(
  { sessionId, agentId, backendUrl, openaiApiKey },
  (step) => console.log(`[STEP] ${step.kind}: ${step.title} — ${step.body.slice(0, 80)}`),
  (steps) => console.log(`[PROOF] Packaging ${steps.length} steps for proof`)
)

runner.start().catch(console.error)

process.on('SIGINT', () => {
  runner.stop()
  process.exit(0)
})
