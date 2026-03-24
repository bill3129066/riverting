import { getDb } from '../../db/client.js'
import { randomUUID } from 'crypto'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSkillById, incrementRunCount } from './skillRegistry.js'
import { geminiQueue } from './requestQueue.js'
import type { SkillRow, SkillExecutionRow } from '../../types/index.js'

interface RunResult {
  executionId: string
  output: string
  durationMs: number
  tokensUsed: number | null
  status: 'completed' | 'failed'
  error?: string
}

/**
 * Render a prompt template by replacing {{variable}} placeholders with input values.
 */
function renderTemplate(template: string, inputs: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = inputs[key]
    return val !== undefined ? String(val) : `{{${key}}}`
  })
}

/**
 * Validate inputs against the skill's input_schema_json (basic required-field check).
 */
function validateInputs(skill: SkillRow, inputs: Record<string, unknown>): string | null {
  if (!skill.input_schema_json) return null

  try {
    const schema = JSON.parse(skill.input_schema_json)
    const required: string[] = schema.required || []
    for (const field of required) {
      if (inputs[field] === undefined || inputs[field] === '') {
        return `Missing required field: ${field}`
      }
    }
  } catch {
    // If schema is malformed, skip validation
  }
  return null
}

export async function runSkillOnce(
  skillId: string,
  userWallet: string,
  inputs: Record<string, unknown>,
): Promise<RunResult> {
  const skill = getSkillById(skillId)
  if (!skill) throw new Error('Skill not found')
  if (!skill.active) throw new Error('Skill is inactive')

  // Validate inputs
  const validationError = validateInputs(skill, inputs)
  if (validationError) throw new Error(validationError)

  const db = getDb()
  const executionId = randomUUID()
  const startTime = Date.now()

  // Create execution record
  db.prepare(`
    INSERT INTO skill_executions (id, skill_id, user_wallet, input_json, status)
    VALUES ($id, $skillId, $userWallet, $inputJson, 'running')
  `).run({
    $id: executionId,
    $skillId: skillId,
    $userWallet: userWallet,
    $inputJson: JSON.stringify(inputs),
  })

  try {
    // Build the user prompt
    let userPrompt: string
    if (skill.user_prompt_template) {
      userPrompt = renderTemplate(skill.user_prompt_template, inputs)
    } else {
      // If no template, pass inputs as structured text
      userPrompt = Object.entries(inputs)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    }

    // Call Gemini (queued to limit concurrency)
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY not configured')

    const { output, tokensUsed } = await geminiQueue.run(async () => {
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({
        model: skill.model || 'gemini-2.0-flash',
        generationConfig: {
          temperature: skill.temperature ?? 0.3,
          maxOutputTokens: skill.max_tokens || 1024,
        },
        systemInstruction: skill.system_prompt,
      })

      const result = await model.generateContent(userPrompt)
      const text = result.response.text()
      const usage = result.response.usageMetadata
      const tokens = usage ? (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0) : null
      return { output: text, tokensUsed: tokens }
    })

    const durationMs = Date.now() - startTime

    // Update execution record
    db.prepare(`
      UPDATE skill_executions SET
        output_text = $output, status = 'completed',
        duration_ms = $durationMs, tokens_used = $tokensUsed,
        amount_charged = $amountCharged, completed_at = datetime('now')
      WHERE id = $id
    `).run({
      $id: executionId,
      $output: output,
      $durationMs: durationMs,
      $tokensUsed: tokensUsed,
      $amountCharged: skill.price_per_run,
    })

    incrementRunCount(skillId)

    return { executionId, output, durationMs, tokensUsed, status: 'completed' }
  } catch (e) {
    const durationMs = Date.now() - startTime
    const errorMessage = (e as Error).message

    db.prepare(`
      UPDATE skill_executions SET
        status = 'failed', error_message = $error,
        duration_ms = $durationMs, completed_at = datetime('now')
      WHERE id = $id
    `).run({
      $id: executionId,
      $error: errorMessage,
      $durationMs: durationMs,
    })

    return { executionId, output: '', durationMs, tokensUsed: null, status: 'failed', error: errorMessage }
  }
}

/**
 * Get executions with permission filtering:
 * - Creator sees all executions for their skill
 * - Authenticated user sees only their own executions
 * - Unauthenticated sees only metadata (no input/output)
 */
export function getExecutionsBySkill(
  skillId: string,
  opts: { requestingWallet?: string; isCreator?: boolean; limit?: number } = {},
): SkillExecutionRow[] {
  const db = getDb()
  const limit = opts.limit ?? 20

  if (opts.isCreator) {
    // Creator sees everything
    return db
      .prepare('SELECT * FROM skill_executions WHERE skill_id = $skillId ORDER BY created_at DESC LIMIT $limit')
      .all({ $skillId: skillId, $limit: limit }) as SkillExecutionRow[]
  }

  if (opts.requestingWallet) {
    // Authenticated user sees only their own
    return db
      .prepare('SELECT * FROM skill_executions WHERE skill_id = $skillId AND user_wallet = $wallet ORDER BY created_at DESC LIMIT $limit')
      .all({ $skillId: skillId, $wallet: opts.requestingWallet, $limit: limit }) as SkillExecutionRow[]
  }

  // Unauthenticated: metadata only (no input/output content)
  return db
    .prepare(`SELECT id, skill_id, user_wallet, status, duration_ms, tokens_used, amount_charged, created_at, completed_at,
      NULL as input_json, NULL as output_text, NULL as output_metadata_json, NULL as error_message
      FROM skill_executions WHERE skill_id = $skillId ORDER BY created_at DESC LIMIT $limit`)
    .all({ $skillId: skillId, $limit: limit }) as SkillExecutionRow[]
}

export function getExecutionById(id: string): SkillExecutionRow | undefined {
  return (getDb().prepare('SELECT * FROM skill_executions WHERE id = $id').get({ $id: id }) as SkillExecutionRow) ?? undefined
}
