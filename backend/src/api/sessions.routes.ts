import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { SessionOrchestrator } from '../services/orchestrator/sessionOrchestrator.js'
import { sseHub } from '../services/realtime/sseHub.js'
import { ProofRelayer } from '../services/proof/proofRelayer.js'

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

  return c.json({ sessionId, status: 'active' }, 201)
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
