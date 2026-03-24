import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { settlementService } from '../services/settlement/settlementService.js'

export const curatorRoutes = new Hono()

curatorRoutes.get('/all/earnings', (c) => {
  const earnings = settlementService.getAllEarnings()
  return c.json(earnings)
})

curatorRoutes.get('/:wallet/earnings', (c) => {
  const wallet = c.req.param('wallet')
  const earnings = settlementService.getCuratorEarnings(wallet)
  return c.json(earnings)
})

curatorRoutes.get('/:wallet/agents', (c) => {
  const db = getDb()
  const wallet = c.req.param('wallet')
  const agents = db
    .prepare('SELECT * FROM agents WHERE curator_wallet = ? COLLATE NOCASE')
    .all(wallet)
  return c.json(agents)
})

curatorRoutes.get('/:wallet/sessions', (c) => {
  const db = getDb()
  const wallet = c.req.param('wallet')
  const sessions = db
    .prepare(
      `
    SELECT s.*, a.name as agent_name, ce.earned_amount as curator_earned
    FROM sessions s
    JOIN agents a ON s.agent_id = a.id
    LEFT JOIN curator_earnings ce ON ce.session_id = s.id
    WHERE a.curator_wallet = ? COLLATE NOCASE
    ORDER BY s.created_at DESC
    LIMIT 50
  `,
    )
    .all(wallet)
  return c.json(sessions)
})
