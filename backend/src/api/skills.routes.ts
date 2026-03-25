import { Hono } from 'hono'
import {
  listSkills, getSkillById, createSkill, updateSkill, deactivateSkill,
  rateSkill, getUserRating, getSkillStats,
} from '../services/skill/skillRegistry.js'
import { runSkillOnce, runSkillStream, chatWithSkill, getExecutionsBySkill } from '../services/skill/skillExecutor.js'
import { compressSkillPrompt, compressPattern } from '../services/skill/skillCompressor.js'
import { getBalance, deposit } from '../services/skill/billing.js'
import { requireSignature } from '../middleware/verifySignature.js'
import { rateLimiter } from '../middleware/rateLimit.js'

export const skillsRoutes = new Hono()

// --- Public read routes (no auth) ---

// List skills (with optional filters)
skillsRoutes.get('/', (c) => {
  const category = c.req.query('category')
  const creator = c.req.query('creator')
  const q = c.req.query('q')
  const skills = listSkills({ category: category || undefined, creator: creator || undefined, q: q || undefined })
  return c.json(skills)
})

// Compress skill content (public — used during upload preview)
skillsRoutes.post('/compress', async (c) => {
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

// Popular skills (must be before /:id)
skillsRoutes.get('/popular', (c) => {
  const skills = listSkills()
  const sorted = skills
    .sort((a, b) => (b.run_count + (b.avg_rating || 0) * 100) - (a.run_count + (a.avg_rating || 0) * 100))
    .slice(0, 20)
  return c.json(sorted)
})

// Get skill by ID
skillsRoutes.get('/:id', (c) => {
  const skill = getSkillById(c.req.param('id'))
  if (!skill) return c.json({ error: 'Skill not found' }, 404)
  return c.json(skill)
})

// Get raw (uncompressed) system prompt
skillsRoutes.get('/:id/raw', (c) => {
  const skill = getSkillById(c.req.param('id'))
  if (!skill) return c.json({ error: 'Skill not found' }, 404)
  return c.json({
    raw_system_prompt: skill.raw_system_prompt || skill.system_prompt,
    system_prompt: skill.system_prompt,
    has_raw: !!skill.raw_system_prompt,
  })
})

// Get skill stats
skillsRoutes.get('/:id/stats', (c) => {
  const stats = getSkillStats(c.req.param('id'))
  return c.json(stats)
})

// Get user's rating for a skill
skillsRoutes.get('/:id/rating', (c) => {
  const wallet = c.req.query('wallet')
  if (!wallet) return c.json({ rating: null })
  const rating = getUserRating(c.req.param('id'), wallet)
  return c.json({ rating })
})

// Get execution history (permission-filtered)
skillsRoutes.get('/:id/executions', (c) => {
  const skillId = c.req.param('id')
  const wallet = c.req.query('wallet')?.toLowerCase()
  const skill = getSkillById(skillId)
  if (!skill) return c.json({ error: 'Skill not found' }, 404)

  const isCreator = wallet ? skill.creator_wallet.toLowerCase() === wallet : false
  const executions = getExecutionsBySkill(skillId, {
    requestingWallet: wallet || undefined,
    isCreator,
  })
  return c.json(executions)
})

// --- Billing routes ---

// Get user balance
skillsRoutes.get('/billing/balance', (c) => {
  const wallet = c.req.query('wallet')
  if (!wallet) return c.json({ error: 'wallet query param required' }, 400)
  return c.json(getBalance(wallet))
})

// Deposit funds (demo: no real payment, just credits)
skillsRoutes.post('/billing/deposit',
  requireSignature('deposit'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()
    const amount = parseInt(body.amount)

    if (!amount || amount <= 0) return c.json({ error: 'Invalid amount' }, 400)

    const balance = deposit(wallet, amount)
    return c.json(balance)
  },
)

// --- Authenticated write routes (signature required) ---

// Create skill
skillsRoutes.post('/',
  requireSignature('create-skill'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()
    const { name, description, systemPrompt } = body

    if (!name || !description || !systemPrompt) {
      return c.json({ error: 'Missing required fields: name, description, systemPrompt' }, 400)
    }

    const skill = createSkill({
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
      pricePerRun: body.pricePerRun,
      ratePerSecond: body.ratePerSecond,
      executionMode: body.executionMode,
      metadataUri: body.metadataUri,
      agentId: body.agentId,
    })

    return c.json(skill, 201)
  },
)

// Update skill
skillsRoutes.put('/:id',
  requireSignature('update-skill'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()

    const updated = updateSkill(c.req.param('id'), { ...body, creatorWallet: wallet })
    if (!updated) return c.json({ error: 'Skill not found or unauthorized' }, 404)
    return c.json(updated)
  },
)

// Delete (deactivate) skill
skillsRoutes.delete('/:id',
  requireSignature('delete-skill'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const ok = deactivateSkill(c.req.param('id'), wallet)
    if (!ok) return c.json({ error: 'Skill not found or unauthorized' }, 404)
    return c.json({ success: true })
  },
)

// Rate a skill (signature required)
skillsRoutes.post('/:id/rate',
  requireSignature('rate-skill'),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()
    const rating = parseInt(body.rating)

    if (!rating || rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be 1-5' }, 400)
    }

    const skill = getSkillById(c.req.param('id'))
    if (!skill) return c.json({ error: 'Skill not found' }, 404)

    const result = rateSkill(c.req.param('id'), wallet, rating)
    return c.json(result)
  },
)

// Execute skill — once mode (signature + rate limit)
skillsRoutes.post('/:id/run',
  requireSignature('run-skill'),
  rateLimiter({ maxRequests: 10, windowMs: 60_000 }),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()

    try {
      const result = await runSkillOnce(c.req.param('id'), wallet, body.inputs || {})
      return c.json(result)
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400)
    }
  },
)

// Execute skill — streaming mode (signature + rate limit, returns SSE)
skillsRoutes.post('/:id/stream',
  requireSignature('run-skill'),
  rateLimiter({ maxRequests: 10, windowMs: 60_000 }),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()

    try {
      const { executionId, stream } = runSkillStream(c.req.param('id'), wallet, body.inputs || {})

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          'X-Execution-Id': executionId,
        },
      })
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400)
    }
  },
)

// Chat with skill — conversational mode (signature + rate limit)
skillsRoutes.post('/:id/chat',
  requireSignature('run-skill'),
  rateLimiter({ maxRequests: 30, windowMs: 60_000 }),
  async (c) => {
    const wallet: string = c.get('verifiedWallet')
    const body = await c.req.json()
    const { message, history, inputs } = body

    if (!message || typeof message !== 'string') {
      return c.json({ error: 'message string required' }, 400)
    }

    if (history && !Array.isArray(history)) {
      return c.json({ error: 'history must be an array' }, 400)
    }

    try {
      const result = await chatWithSkill(
        c.req.param('id'),
        wallet,
        message,
        history || [],
        inputs || {},
      )
      return c.json(result)
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400)
    }
  },
)
