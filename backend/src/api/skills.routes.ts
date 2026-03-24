import { Hono } from 'hono'
import {
  listSkills, getSkillById, createSkill, updateSkill, deactivateSkill,
} from '../services/skill/skillRegistry.js'
import { runSkillOnce, getExecutionsBySkill } from '../services/skill/skillExecutor.js'
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

// Get skill by ID
skillsRoutes.get('/:id', (c) => {
  const skill = getSkillById(c.req.param('id'))
  if (!skill) return c.json({ error: 'Skill not found' }, 404)
  return c.json(skill)
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

// Execute skill (signature + rate limit)
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
