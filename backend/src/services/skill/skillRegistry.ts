import { getDb } from '../../db/client.js'
import { randomUUID } from 'crypto'
import type { SkillRow, CreateSkillInput, UpdateSkillInput } from '../../types/index.js'

export function listSkills(filters?: { category?: string; creator?: string; q?: string }): SkillRow[] {
  const db = getDb()
  let sql = 'SELECT * FROM skills WHERE active = 1'
  const params: Record<string, string> = {}

  if (filters?.category) {
    sql += ' AND category = $category'
    params.$category = filters.category
  }
  if (filters?.creator) {
    sql += ' AND creator_wallet = $creator'
    params.$creator = filters.creator
  }
  if (filters?.q) {
    sql += ' AND (name LIKE $q OR description LIKE $q)'
    params.$q = `%${filters.q}%`
  }

  sql += ' ORDER BY run_count DESC, created_at DESC'
  return db.prepare(sql).all(params) as SkillRow[]
}

export function getSkillById(id: string): SkillRow | undefined {
  return (getDb().prepare('SELECT * FROM skills WHERE id = $id').get({ $id: id }) as SkillRow) ?? undefined
}

export function createSkill(input: CreateSkillInput): SkillRow {
  const db = getDb()
  const id = randomUUID()

  db.prepare(`
    INSERT INTO skills (id, agent_id, creator_wallet, name, description, category,
      system_prompt, user_prompt_template, model, temperature, max_tokens,
      tools_json, input_schema_json, price_per_run, rate_per_second,
      execution_mode, metadata_uri)
    VALUES ($id, $agentId, $creatorWallet, $name, $description, $category,
      $systemPrompt, $userPromptTemplate, $model, $temperature, $maxTokens,
      $toolsJson, $inputSchemaJson, $pricePerRun, $ratePerSecond,
      $executionMode, $metadataUri)
  `).run({
    $id: id,
    $agentId: input.agentId ?? null,
    $creatorWallet: input.creatorWallet,
    $name: input.name,
    $description: input.description,
    $category: input.category ?? 'general',
    $systemPrompt: input.systemPrompt,
    $userPromptTemplate: input.userPromptTemplate ?? null,
    $model: input.model ?? 'gemini-2.0-flash',
    $temperature: input.temperature ?? 0.3,
    $maxTokens: input.maxTokens ?? 1024,
    $toolsJson: input.toolsJson ?? null,
    $inputSchemaJson: input.inputSchemaJson ?? null,
    $pricePerRun: input.pricePerRun ?? 0,
    $ratePerSecond: input.ratePerSecond ?? null,
    $executionMode: input.executionMode ?? 'once',
    $metadataUri: input.metadataUri ?? null,
  })

  return getSkillById(id)!
}

export function updateSkill(id: string, input: UpdateSkillInput): SkillRow | undefined {
  const existing = getSkillById(id)
  if (!existing) return undefined
  if (existing.creator_wallet !== input.creatorWallet) return undefined

  const db = getDb()
  db.prepare(`
    UPDATE skills SET
      name = $name, description = $description, category = $category,
      system_prompt = $systemPrompt, user_prompt_template = $userPromptTemplate,
      model = $model, temperature = $temperature, max_tokens = $maxTokens,
      tools_json = $toolsJson, input_schema_json = $inputSchemaJson,
      price_per_run = $pricePerRun, rate_per_second = $ratePerSecond,
      execution_mode = $executionMode, metadata_uri = $metadataUri,
      updated_at = datetime('now')
    WHERE id = $id
  `).run({
    $id: id,
    $name: input.name ?? existing.name,
    $description: input.description ?? existing.description,
    $category: input.category ?? existing.category,
    $systemPrompt: input.systemPrompt ?? existing.system_prompt,
    $userPromptTemplate: input.userPromptTemplate ?? existing.user_prompt_template,
    $model: input.model ?? existing.model,
    $temperature: input.temperature ?? existing.temperature,
    $maxTokens: input.maxTokens ?? existing.max_tokens,
    $toolsJson: input.toolsJson ?? existing.tools_json,
    $inputSchemaJson: input.inputSchemaJson ?? existing.input_schema_json,
    $pricePerRun: input.pricePerRun ?? existing.price_per_run,
    $ratePerSecond: input.ratePerSecond ?? existing.rate_per_second,
    $executionMode: input.executionMode ?? existing.execution_mode,
    $metadataUri: input.metadataUri ?? existing.metadata_uri,
  })

  return getSkillById(id)
}

export function deactivateSkill(id: string, creatorWallet: string): boolean {
  const existing = getSkillById(id)
  if (!existing || existing.creator_wallet !== creatorWallet) return false

  getDb().prepare('UPDATE skills SET active = 0, updated_at = datetime(\'now\') WHERE id = $id').run({ $id: id })
  return true
}

export function incrementRunCount(id: string): void {
  getDb().prepare('UPDATE skills SET run_count = run_count + 1 WHERE id = $id').run({ $id: id })
}

export function rateSkill(skillId: string, userWallet: string, rating: number): { avg_rating: number; count: number } {
  const db = getDb()

  db.prepare(`
    INSERT INTO skill_ratings (id, skill_id, user_wallet, rating)
    VALUES ($id, $skillId, $wallet, $rating)
    ON CONFLICT(skill_id, user_wallet) DO UPDATE SET rating = $rating, created_at = datetime('now')
  `).run({
    $id: randomUUID(),
    $skillId: skillId,
    $wallet: userWallet.toLowerCase(),
    $rating: rating,
  })

  // Recalculate average
  const stats = db.prepare(
    'SELECT AVG(rating) as avg, COUNT(*) as cnt FROM skill_ratings WHERE skill_id = $skillId',
  ).get({ $skillId: skillId }) as { avg: number; cnt: number }

  // Update skill's cached average
  db.prepare('UPDATE skills SET avg_rating = $avg, updated_at = datetime(\'now\') WHERE id = $id').run({
    $id: skillId,
    $avg: stats.avg,
  })

  return { avg_rating: Math.round(stats.avg * 10) / 10, count: stats.cnt }
}

export function getUserRating(skillId: string, userWallet: string): number | null {
  const row = getDb().prepare(
    'SELECT rating FROM skill_ratings WHERE skill_id = $skillId AND user_wallet = $wallet',
  ).get({ $skillId: skillId, $wallet: userWallet.toLowerCase() }) as { rating: number } | undefined

  return row?.rating ?? null
}

export function getSkillStats(skillId: string): { runCount: number; avgRating: number | null; ratingCount: number; totalEarned: number } {
  const db = getDb()
  const skill = getSkillById(skillId)
  if (!skill) return { runCount: 0, avgRating: null, ratingCount: 0, totalEarned: 0 }

  const ratings = db.prepare(
    'SELECT COUNT(*) as cnt FROM skill_ratings WHERE skill_id = $skillId',
  ).get({ $skillId: skillId }) as { cnt: number }

  const earnings = db.prepare(
    'SELECT COALESCE(SUM(amount_charged), 0) as total FROM skill_executions WHERE skill_id = $skillId AND status = \'completed\'',
  ).get({ $skillId: skillId }) as { total: number }

  return {
    runCount: skill.run_count,
    avgRating: skill.avg_rating,
    ratingCount: ratings.cnt,
    totalEarned: earnings.total,
  }
}
