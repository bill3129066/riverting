import { getDb } from '../../db/client.js'
import { randomUUID } from 'crypto'
import { settlementService } from '../settlement/settlementService.js'

export class SessionOrchestrator {
  async onSessionCreated(args: {
    sessionId: bigint
    agentId: bigint
    user: string
    deposit: bigint
    totalRate: bigint
  }) {
    const db = getDb()
    const existing = db
      .prepare('SELECT id FROM sessions WHERE onchain_session_id = ?')
      .get(Number(args.sessionId)) as { id: string } | undefined
    if (existing) return

    const agent = db
      .prepare('SELECT id FROM agents WHERE onchain_agent_id = ? OR id = ?')
      .get(Number(args.agentId), Number(args.agentId)) as
      | { id: number }
      | undefined

    const sessionId = randomUUID()
    db.prepare(
      `
      INSERT INTO sessions (id, onchain_session_id, agent_id, user_wallet, status, total_rate, curator_rate, platform_fee, deposit_amount, started_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, datetime('now'))
    `,
    ).run(
      sessionId,
      Number(args.sessionId),
      agent?.id || 1,
      args.user,
      Number(args.totalRate),
      Number(args.totalRate) - 300, // curatorRate = totalRate - platformFee
      300,
      Number(args.deposit),
    )

    console.log(
      `[Orchestrator] Session created: ${sessionId} (onchain: ${args.sessionId})`,
    )
  }

  async onProofTimeout(args: { sessionId: bigint }) {
    const db = getDb()
    db.prepare(
      "UPDATE sessions SET status = 'paused' WHERE onchain_session_id = ?",
    ).run(Number(args.sessionId))
    console.log(`[Orchestrator] Session paused (timeout): ${args.sessionId}`)
  }

  async onSessionStopped(args: { sessionId: bigint }) {
    const db = getDb()
    db.prepare(
      "UPDATE sessions SET status = 'stopped', ended_at = datetime('now') WHERE onchain_session_id = ?",
    ).run(Number(args.sessionId))

    const session = db
      .prepare('SELECT id FROM sessions WHERE onchain_session_id = ?')
      .get(Number(args.sessionId)) as { id: string } | undefined
    if (session) {
      settlementService.recordSessionEarnings(session.id)
    }

    console.log(`[Orchestrator] Session stopped: ${args.sessionId}`)
  }

  async createSessionRecord(params: {
    onchainSessionId: number
    agentId: number
    userWallet: string
    totalRate: number
    curatorRate: number
    platformFee: number
    depositAmount: number
  }) {
    const db = getDb()
    const sessionId = randomUUID()
    db.prepare(
      `
      INSERT OR IGNORE INTO sessions (id, onchain_session_id, agent_id, user_wallet, status, total_rate, curator_rate, platform_fee, deposit_amount, started_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, datetime('now'))
    `,
    ).run(
      sessionId,
      params.onchainSessionId,
      params.agentId,
      params.userWallet,
      params.totalRate,
      params.curatorRate,
      params.platformFee,
      params.depositAmount,
    )
    return sessionId
  }
}
