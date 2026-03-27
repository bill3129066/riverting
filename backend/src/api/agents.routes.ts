import { Hono } from 'hono'
import {
  listAgents, getAgentById, createAgent, updateAgent, deactivateAgent,
  rateAgent, getUserRating, getAgentStats,
} from '../services/agent/agentRegistry.js'
import { getExecutionsByAgent, chatWithAgent } from '../services/agent/agentExecutor.js'
import { getBalance, deposit } from '../services/session/billingService.js'
import { compressSkillPrompt, compressPattern } from '../services/skill/skillCompressor.js'
import { requireSignature } from '../middleware/verifySignature.js'
import { rateLimiter } from '../middleware/rateLimit.js'

export const agentsRoutes = new Hono()

agentsRoutes.get('/', (c) => {
  const category = c.req.query('category')
  const creator = c.req.query('creator')
  const q = c.req.query('q')
  const agents = listAgents({ category: category || undefined, creatorWallet: creator || undefined, q: q || undefined })
  return c.json(agents)
})

agentsRoutes.post('/compress', async (c) => {
  const body = await c.req.json()
  const { content, type } = body

  if (!content || typeof content !== 'string') {
    return c.json({ error: 'content string required' }, 400)
  }

  const compressed = type === 'pattern'
    ? await compressPattern(content)
    : await compressSkillPrompt(content)

  return c.json({
    original: content.length,
    compressed: compressed.length,
    ratio: ((1 - compressed.length / content.length) * 100).toFixed(1) + '%',
    content: compressed,
  })
})

agentsRoutes.get('/popular', (c) => {
  const agents = listAgents()
  const sorted = agents
    .sort((a, b) => (b.run_count + (b.avg_rating || 0) * 100) - (a.run_count + (a.avg_rating || 0) * 100))
    .slice(0, 20)
  return c.json(sorted)
})

agentsRoutes.get('/billing/balance', (c) => {
  const wallet = c.req.query('wallet')
  if (!wallet) return c.json({ error: 'wallet query param required' }, 400)
  return c.json({ balance: getBalance(wallet) })
})

agentsRoutes.post('/billing/deposit',
  requireSignature('deposit'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()
    const amount = parseInt(body.amount)

    if (!amount || amount <= 0) return c.json({ error: 'Invalid amount' }, 400)

    const balance = deposit(wallet, amount)
    return c.json({ balance })
  },
)

agentsRoutes.get('/:id', (c) => {
  const agent = getAgentById(c.req.param('id'))
  if (!agent) return c.json({ error: 'Agent not found' }, 404)
  return c.json(agent)
})

agentsRoutes.get('/:id/stats', (c) => {
  const stats = getAgentStats(c.req.param('id'))
  return c.json(stats)
})

agentsRoutes.get('/:id/rating', (c) => {
  const wallet = c.req.query('wallet')
  if (!wallet) return c.json({ rating: null })
  const rating = getUserRating(c.req.param('id'), wallet)
  return c.json({ rating })
})

agentsRoutes.get('/:id/executions', (c) => {
  const agentId = c.req.param('id')
  const wallet = c.req.query('wallet')?.toLowerCase()
  const agent = getAgentById(agentId)
  if (!agent) return c.json({ error: 'Agent not found' }, 404)

  const isCreator = wallet ? agent.creator_wallet.toLowerCase() === wallet : false
  const executions = getExecutionsByAgent(agentId, {
    requestingWallet: wallet || undefined,
    isCreator,
  })
  return c.json(executions)
})

agentsRoutes.post('/',
  requireSignature('create-agent'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()
    const { name, description, systemPrompt } = body

    if (!name || !description || !systemPrompt) {
      return c.json({ error: 'Missing required fields: name, description, systemPrompt' }, 400)
    }

    const agent = createAgent({
      creatorWallet: wallet,
      name,
      description,
      category: body.category,
      systemPrompt,
      rawSystemPrompt: body.rawSystemPrompt,
      userPromptTemplate: body.userPromptTemplate,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      toolsJson: body.toolsJson,
      inputSchemaJson: body.inputSchemaJson,
      ratePerSecond: body.ratePerSecond,
      metadataUri: body.metadataUri,
    })

    return c.json(agent, 201)
  },
)

agentsRoutes.put('/:id',
  requireSignature('update-agent'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()

    const updated = updateAgent(c.req.param('id'), { ...body, creatorWallet: wallet })
    if (!updated) return c.json({ error: 'Agent not found or unauthorized' }, 404)
    return c.json(updated)
  },
)

agentsRoutes.delete('/:id',
  requireSignature('delete-agent'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    deactivateAgent(c.req.param('id'), wallet)
    return c.json({ success: true })
  },
)

// Chat with agent — demo mode (no auth)
agentsRoutes.post('/:id/chat-demo',
  rateLimiter({ maxRequests: 30, windowMs: 60_000 }),
  async (c) => {
    const body = await c.req.json()
    const { message, history, inputs } = body

    if (!message || typeof message !== 'string') {
      return c.json({ error: 'message string required' }, 400)
    }

    try {
      const result = await chatWithAgent(
        c.req.param('id'), 'demo-user', message, history || [], inputs || {},
      )
      return c.json(result)
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400)
    }
  },
)

// Chat with agent — authenticated mode
agentsRoutes.post('/:id/chat',
  requireSignature('run-skill'),
  rateLimiter({ maxRequests: 30, windowMs: 60_000 }),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()
    const { message, history, inputs } = body

    if (!message || typeof message !== 'string') {
      return c.json({ error: 'message string required' }, 400)
    }

    try {
      const result = await chatWithAgent(
        c.req.param('id'), wallet, message, history || [], inputs || {},
      )
      return c.json(result)
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400)
    }
  },
)

agentsRoutes.post('/:id/rate',
  requireSignature('rate-agent'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()
    const rating = parseInt(body.rating)

    if (!rating || rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be 1-5' }, 400)
    }

    const agent = getAgentById(c.req.param('id'))
    if (!agent) return c.json({ error: 'Agent not found' }, 404)

    const result = rateAgent(c.req.param('id'), wallet, rating)
    return c.json(result)
  },
)
