import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { SessionOrchestrator } from '../services/orchestrator/sessionOrchestrator.js'
import { sseHub } from '../services/realtime/sseHub.js'
import { ProofRelayer } from '../services/proof/proofRelayer.js'
import { instanceManager } from '../services/instance/instanceManager.js'
import { settlementService } from '../services/settlement/settlementService.js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { requireSignature, type SignatureEnv } from '../middleware/verifySignature.js'
import { getAgentById } from '../services/registry/agentRegistry.js'

const orchestrator = new SessionOrchestrator()

export const sessionsRoutes = new Hono<SignatureEnv>()

// --- Public read routes ---

sessionsRoutes.get('/', (c) => {
  const db = getDb()
  const sessions = db.prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 50').all()
  return c.json(sessions)
})

sessionsRoutes.get('/:id', (c) => {
  const db = getDb()
  const session = db
    .prepare('SELECT * FROM sessions WHERE id = ? OR onchain_session_id = ?')
    .get(c.req.param('id'), parseInt(c.req.param('id')) || 0)
  if (!session) return c.json({ error: 'Not found' }, 404)
  return c.json(session)
})

sessionsRoutes.get('/:id/steps', (c) => {
  const db = getDb()
  const steps = db
    .prepare('SELECT * FROM session_steps WHERE session_id = ? ORDER BY seq ASC')
    .all(c.req.param('id'))
  return c.json(steps)
})

sessionsRoutes.get('/:id/stream', (c) => {
  const sessionId = c.req.param('id')
  const lastEventId = parseInt(c.req.header('Last-Event-ID') || '0')

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ sessionId })}\n\n`),
      )
      const sub = sseHub.subscribe(sessionId, controller, lastEventId)
      c.req.raw.signal?.addEventListener('abort', () => {
        sseHub.unsubscribe(sessionId, sub)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
})

// --- Authenticated write routes ---

sessionsRoutes.post('/:id/spawn',
  requireSignature('spawn-session'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()

    // Validate agent exists and is active
    const agentId = body.agentId
    if (!agentId) return c.json({ error: 'agentId is required' }, 400)

    const agent = getAgentById(agentId)
    if (!agent) return c.json({ error: 'Agent not found' }, 404)
    if (!agent.active) return c.json({ error: 'Agent is inactive' }, 400)

    const sessionId = await orchestrator.createSessionRecord({
      onchainSessionId: parseInt(c.req.param('id')!),
      agentId,
      userWallet: wallet, // from verified signature
      totalRate: body.totalRate || 1300,
      curatorRate: body.curatorRate || 1000,
      platformFee: body.platformFee || 300,
      depositAmount: body.depositAmount || 5000000,
    })

    sseHub.emitStatus(sessionId, 'active')
    const relayer = new ProofRelayer()
    relayer.startProofLoop(sessionId)
    const instanceId = await instanceManager.spawnInstance(sessionId, agentId)

    return c.json({ sessionId, instanceId, status: 'active' }, 201)
  },
)

sessionsRoutes.post('/:id/pause',
  requireSignature('pause-session'),
  (c) => {
    const sessionId = c.req.param('id')!
    instanceManager.pauseInstance(sessionId)
    const db = getDb()
    db.prepare("UPDATE sessions SET status = 'paused' WHERE id = ?").run(sessionId)
    return c.json({ sessionId, status: 'paused' })
  },
)

sessionsRoutes.post('/:id/resume',
  requireSignature('resume-session'),
  (c) => {
    const sessionId = c.req.param('id')!
    instanceManager.resumeInstance(sessionId)
    const db = getDb()
    db.prepare("UPDATE sessions SET status = 'active' WHERE id = ?").run(sessionId)
    return c.json({ sessionId, status: 'active' })
  },
)

sessionsRoutes.post('/:id/stop',
  requireSignature('stop-session'),
  (c) => {
    const sessionId = c.req.param('id')!
    instanceManager.stopInstance(sessionId)
    const db = getDb()
    db.prepare("UPDATE sessions SET status = 'stopped', ended_at = datetime('now') WHERE id = ?").run(sessionId)
    settlementService.recordSessionEarnings(sessionId)
    return c.json({ sessionId, status: 'stopped' })
  },
)

sessionsRoutes.post('/:id/chat',
  requireSignature('session-chat'),
  async (c) => {
    const sessionId = c.req.param('id')!
    const body = await c.req.json()
    const message = body.message
    const history = body.history

    if (!message || typeof message !== 'string') {
      return c.json({ error: 'message is required and must be a string' }, 400)
    }

    // Validate history format
    if (history && !Array.isArray(history)) {
      return c.json({ error: 'history must be an array' }, 400)
    }
    const validHistory = (history || []).filter((msg: any) =>
      msg && typeof msg.role === 'string' && Array.isArray(msg.parts) &&
      ['user', 'model'].includes(msg.role) &&
      msg.parts.every((p: any) => typeof p.text === 'string')
    )

    const db = getDb()
    const session = db.prepare('SELECT agent_id FROM sessions WHERE id = ?').get(sessionId) as { agent_id: number } | undefined
    if (!session) return c.json({ error: 'Session not found' }, 404)

    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(session.agent_id) as any
    if (!agent) return c.json({ error: 'Agent not found for this session' }, 404)

    const skillConfig = agent.skill_config_json
      ? (typeof agent.skill_config_json === 'string' ? JSON.parse(agent.skill_config_json) : agent.skill_config_json)
      : {}

    const systemPrompt = skillConfig.systemPrompt
      || `You are ${agent.name}. ${agent.description}. Answer questions concisely.`

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return c.json({ error: 'AI not configured (missing GEMINI_API_KEY)' }, 500)

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: (skillConfig.model && skillConfig.model.startsWith('gemini')) ? skillConfig.model : 'gemini-2.0-flash',
        generationConfig: { temperature: skillConfig.temperature ?? 0.7, maxOutputTokens: 512 },
        systemInstruction: systemPrompt,
      })
      const chat = model.startChat({ history: validHistory })
      const result = await chat.sendMessage(message)
      const reply = result.response.text()
      return c.json({ reply })
    } catch (e: any) {
      return c.json({ error: e.message }, 500)
    }
  },
)
