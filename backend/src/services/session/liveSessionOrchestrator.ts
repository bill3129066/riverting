import { getDb } from '../../db/client.js'
import { randomUUID } from 'crypto'
import { canTransition, BILLING_STATES, PROOF_STATES, type SessionState } from './sessionStateMachine.js'
import { chatWithAgent } from '../agent/agentExecutor.js'
import { reserveDeposit, accrueCharge, settleSession } from './billingService.js'

// ─── Types ───────────────────────────────────────────────────

interface ActiveSession {
  id: string
  agentId: string
  userWallet: string
  state: SessionState
  startedAt: number
  billingInterval?: ReturnType<typeof setInterval>
  proofInterval?: ReturnType<typeof setInterval>
  totalAccrued: number
  ratePerSecond: number
}

// ─── In-memory session store ─────────────────────────────────

const activeSessions = new Map<string, ActiveSession>()

// ─── Helpers ─────────────────────────────────────────────────

function transitionOrThrow(session: ActiveSession, to: SessionState): void {
  if (!canTransition(session.state, to)) {
    throw new Error(`Invalid transition: ${session.state} → ${to}`)
  }
  session.state = to
}

function verifyOwnership(session: ActiveSession, wallet: string): void {
  if (session.userWallet.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error('Not authorized: wallet does not own this session')
  }
}

function startBillingInterval(session: ActiveSession): void {
  if (!BILLING_STATES.has(session.state)) return

  session.billingInterval = setInterval(() => {
    const charged = accrueCharge(session.id, session.userWallet, session.ratePerSecond, 1)
    if (charged > 0) {
      session.totalAccrued += charged
    } else {
      console.log(`[Orchestrator] Session ${session.id} auto-stopping: insufficient balance`)
      stopSessionInternal(session)
    }
  }, 1_000)
}

function startProofInterval(session: ActiveSession): void {
  if (!PROOF_STATES.has(session.state)) return

  const db = getDb()
  let proofSeq = 0

  session.proofInterval = setInterval(() => {
    proofSeq++
    db.prepare(`
      INSERT INTO proofs (id, session_id, seq, proof_hash)
      VALUES ($id, $sessionId, $seq, $proofHash)
    `).run({
      $id: randomUUID(),
      $sessionId: session.id,
      $seq: proofSeq,
      $proofHash: randomUUID(),
    })
  }, 4_000)
}

function clearIntervals(session: ActiveSession): void {
  if (session.billingInterval) {
    clearInterval(session.billingInterval)
    session.billingInterval = undefined
  }
  if (session.proofInterval) {
    clearInterval(session.proofInterval)
    session.proofInterval = undefined
  }
}

function stopSessionInternal(session: ActiveSession): void {
  clearIntervals(session)

  if (canTransition(session.state, 'stopped')) {
    session.state = 'stopped'
  }

  const durationSec = Math.floor((Date.now() - session.startedAt) / 1_000)
  const db = getDb()

  const agent = db
    .prepare('SELECT creator_wallet FROM agents WHERE id = $id')
    .get({ $id: session.agentId }) as { creator_wallet: string } | undefined

  if (agent) {
    settleSession(session.id, agent.creator_wallet, session.totalAccrued, session.ratePerSecond)
  }

  db.prepare(`
    UPDATE sessions SET status = 'stopped', ended_at = datetime('now')
    WHERE id = $id
  `).run({ $id: session.id })

  console.log(
    `[Orchestrator] Session ${session.id} stopped after ${durationSec}s, total accrued: ${session.totalAccrued}`,
  )
}

// ─── Public API ──────────────────────────────────────────────

export function startSession(
  agentId: string,
  userWallet: string,
  _inputs?: Record<string, string>,
): { sessionId: string } {
  const db = getDb()

  const agent = db
    .prepare('SELECT * FROM agents WHERE id = $id AND active = 1')
    .get({ $id: agentId }) as {
      id: string
      rate_per_second: number
      creator_wallet: string
    } | undefined

  if (!agent) throw new Error('Agent not found or inactive')

  const ratePerSecond = agent.rate_per_second
  const minDeposit = ratePerSecond * 60

  reserveDeposit(userWallet, minDeposit)

  const sessionId = randomUUID()
  const PLATFORM_FEE_BPS = 300
  const curatorRate = Math.floor(ratePerSecond * (10_000 - PLATFORM_FEE_BPS) / 10_000)
  const platformFee = ratePerSecond - curatorRate

  db.prepare(`
    INSERT INTO sessions (id, agent_id, user_wallet, status, total_rate, curator_rate, platform_fee, deposit_amount, started_at)
    VALUES ($id, $agentId, $userWallet, $status, $totalRate, $curatorRate, $platformFee, $depositAmount, datetime('now'))
  `).run({
    $id: sessionId,
    $agentId: agentId,
    $userWallet: userWallet.toLowerCase(),
    $status: 'created',
    $totalRate: ratePerSecond,
    $curatorRate: curatorRate,
    $platformFee: platformFee,
    $depositAmount: minDeposit,
  })

  const session: ActiveSession = {
    id: sessionId,
    agentId,
    userWallet: userWallet.toLowerCase(),
    state: 'created',
    startedAt: Date.now(),
    totalAccrued: 0,
    ratePerSecond,
  }

  transitionOrThrow(session, 'active')
  db.prepare("UPDATE sessions SET status = 'active' WHERE id = $id").run({ $id: sessionId })

  startBillingInterval(session)
  startProofInterval(session)
  activeSessions.set(sessionId, session)

  console.log(
    `[Orchestrator] Session ${sessionId} started for agent ${agentId} at ${ratePerSecond} micro-USDC/s`,
  )

  return { sessionId }
}

export function pauseSession(sessionId: string, wallet: string): void {
  const session = activeSessions.get(sessionId)
  if (!session) throw new Error('Session not found')

  verifyOwnership(session, wallet)
  transitionOrThrow(session, 'paused')
  clearIntervals(session)

  getDb().prepare("UPDATE sessions SET status = 'paused' WHERE id = $id").run({ $id: sessionId })
  console.log(`[Orchestrator] Session ${sessionId} paused`)
}

export function resumeSession(sessionId: string, wallet: string): void {
  const session = activeSessions.get(sessionId)
  if (!session) throw new Error('Session not found')

  verifyOwnership(session, wallet)
  transitionOrThrow(session, 'active')

  startBillingInterval(session)
  startProofInterval(session)

  getDb().prepare("UPDATE sessions SET status = 'active' WHERE id = $id").run({ $id: sessionId })
  console.log(`[Orchestrator] Session ${sessionId} resumed`)
}

export function stopSession(sessionId: string, wallet: string): void {
  const session = activeSessions.get(sessionId)
  if (!session) throw new Error('Session not found')

  verifyOwnership(session, wallet)
  stopSessionInternal(session)
}

export async function chatInSession(
  sessionId: string,
  message: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
): Promise<{ reply: string; toolCallCount: number }> {
  const session = activeSessions.get(sessionId)
  if (!session) throw new Error('Session not found')
  if (session.state !== 'active') throw new Error('Session is not active')

  const result = await chatWithAgent(
    session.agentId,
    session.userWallet,
    message,
    history,
  )

  return { reply: result.reply, toolCallCount: result.toolCallCount }
}

export function getSessionState(sessionId: string): ActiveSession | undefined {
  return activeSessions.get(sessionId)
}

export function getSessionDetails(sessionId: string): Record<string, unknown> | null {
  const row = getDb()
    .prepare('SELECT * FROM sessions WHERE id = $id')
    .get({ $id: sessionId }) as Record<string, unknown> | undefined

  return row ?? null
}
