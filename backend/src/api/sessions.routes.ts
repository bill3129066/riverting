import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { SessionOrchestrator } from '../services/orchestrator/sessionOrchestrator.js'
import { sseHub } from '../services/realtime/sseHub.js'
import { ProofRelayer } from '../services/proof/proofRelayer.js'
import { instanceManager } from '../services/instance/instanceManager.js'
import { settlementService } from '../services/settlement/settlementService.js'

const orchestrator = new SessionOrchestrator()

export const sessionsRoutes = new Hono()

sessionsRoutes.get('/', (c) => {
  const db = getDb()
  const sessions = db
    .prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 50')
    .all()
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

sessionsRoutes.post('/:id/spawn', async (c) => {
  const body = await c.req.json()
  const sessionId = await orchestrator.createSessionRecord({
    onchainSessionId: parseInt(c.req.param('id')),
    agentId: body.agentId || 1,
    userWallet:
      body.userWallet || '0x0000000000000000000000000000000000000000',
    totalRate: body.totalRate || 1300,
    curatorRate: body.curatorRate || 1000,
    platformFee: body.platformFee || 300,
    depositAmount: body.depositAmount || 5000000,
  })

  sseHub.emitStatus(sessionId, 'active')

  const relayer = new ProofRelayer()
  relayer.startProofLoop(sessionId)

  const instanceId = await instanceManager.spawnInstance(sessionId, body.agentId || 1)

  return c.json({ sessionId, instanceId, status: 'active' }, 201)
})

sessionsRoutes.post('/:id/pause', (c) => {
  const sessionId = c.req.param('id')
  instanceManager.pauseInstance(sessionId)
  const db = getDb()
  db.prepare("UPDATE sessions SET status = 'paused' WHERE id = ?").run(sessionId)
  return c.json({ sessionId, status: 'paused' })
})

sessionsRoutes.post('/:id/resume', (c) => {
  const sessionId = c.req.param('id')
  instanceManager.resumeInstance(sessionId)
  const db = getDb()
  db.prepare("UPDATE sessions SET status = 'active' WHERE id = ?").run(sessionId)
  return c.json({ sessionId, status: 'active' })
})

sessionsRoutes.post('/:id/stop', (c) => {
  const sessionId = c.req.param('id')
  instanceManager.stopInstance(sessionId)
  const db = getDb()
  db.prepare("UPDATE sessions SET status = 'stopped', ended_at = datetime('now') WHERE id = ?").run(
    sessionId,
  )
  settlementService.recordSessionEarnings(sessionId)
  return c.json({ sessionId, status: 'stopped' })
})

sessionsRoutes.get('/:id/steps', (c) => {
  const db = getDb()
  const steps = db
    .prepare(
      'SELECT * FROM session_steps WHERE session_id = ? ORDER BY seq ASC',
    )
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
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ sessionId })}\n\n`,
        ),
      )

      const sub = sseHub.subscribe(sessionId, controller, lastEventId)

      c.req.raw.signal?.addEventListener('abort', () => {
        sseHub.unsubscribe(sessionId, sub)
        try {
          controller.close()
        } catch {
          // controller may already be closed
        }
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
