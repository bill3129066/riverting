import { Hono } from 'hono'
import {
  listSkills, getSkillById, createSkill, updateSkill, deactivateSkill,
} from '../services/skill/skillRegistry.js'
import { runSkillOnce, getExecutionsBySkill } from '../services/skill/skillExecutor.js'

export const skillsRoutes = new Hono()

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

// Create skill
skillsRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { creatorWallet, name, description, systemPrompt } = body

  if (!creatorWallet || !name || !description || !systemPrompt) {
    return c.json({ error: 'Missing required fields: creatorWallet, name, description, systemPrompt' }, 400)
  }

  const skill = createSkill({
    creatorWallet,
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
})

// Update skill
skillsRoutes.put('/:id', async (c) => {
  const body = await c.req.json()
  if (!body.creatorWallet) {
    return c.json({ error: 'creatorWallet required for authorization' }, 400)
  }

  const updated = updateSkill(c.req.param('id'), body)
  if (!updated) return c.json({ error: 'Skill not found or unauthorized' }, 404)
  return c.json(updated)
})

// Delete (deactivate) skill
skillsRoutes.delete('/:id', async (c) => {
  const body = await c.req.json()
  if (!body.creatorWallet) {
    return c.json({ error: 'creatorWallet required for authorization' }, 400)
  }

  const ok = deactivateSkill(c.req.param('id'), body.creatorWallet)
  if (!ok) return c.json({ error: 'Skill not found or unauthorized' }, 404)
  return c.json({ success: true })
})

// Execute skill (once mode)
skillsRoutes.post('/:id/run', async (c) => {
  const body = await c.req.json()
  const { userWallet, inputs } = body

  if (!userWallet) {
    return c.json({ error: 'userWallet is required' }, 400)
  }

  try {
    const result = await runSkillOnce(c.req.param('id'), userWallet, inputs || {})
    return c.json(result)
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400)
  }
})

// Get skill execution history
skillsRoutes.get('/:id/executions', (c) => {
  const executions = getExecutionsBySkill(c.req.param('id'))
  return c.json(executions)
})
