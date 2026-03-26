# Learnings

## agentRegistry.ts (Task 1)
- `skillRegistry.ts` is the direct template — same DB patterns, just table/column name changes
- Types already unified: `SkillRow = AgentRow`, `CreateSkillInput = CreateAgentInput` (aliases in types/index.ts)
- `agents_v2` has UUID TEXT PK (not autoincrement like old `agents` table which used numeric IDs)
- `agents_v2` drops `price_per_run` and `execution_mode` fields that `skills` had — only `rate_per_second`
- `agents_v2` adds `onchain_agent_id` and `migrated_from` fields not in `skills`
- Ratings table is `agent_ratings` with `UNIQUE(agent_id, user_wallet)` for upsert
- `getAgentStats.total_earned` is hardcoded to 0 — will derive from `curator_earnings` table later
- `updateAgent` throws on not-found/unauthorized (vs skillRegistry returning undefined) — cleaner for callers
- `deactivateAgent` uses WHERE clause for ownership check instead of pre-check + separate update

## billingService.ts (Task 2)
- `shared/config/pricing.ts` is outside backend's `rootDir` — can't import directly; use `backend/src/config.ts` which re-exports `platformFeeRate` as BigInt
- `crypto` module import shows TS error across entire backend (bun-types doesn't declare it) — pre-existing, runtime works fine
- Old `billing.ts` had `charge()` (per-run); new `accrueCharge()` takes `ratePerSecond * durationSec` for per-second model
- `settlementService.ts` uses `INSERT OR IGNORE` for idempotent curator_earnings — same pattern in `settleSession()`
- `PLATFORM_FEE_RATE = 300n` (BigInt) = 300 BPS = 3% platform fee; convert with `Number()` for integer math

## agentExecutor.ts (Task 3)
- Direct 1:1 adaptation of `skillExecutor.ts` (~458 → ~476 lines with onStepEmit additions)
- `price_per_run` doesn't exist on `AgentRow` (only `rate_per_second`) — used `(agent as any).price_per_run` to avoid compile errors; billing will be replaced in a later task
- Import paths from `../skill/` for shared modules: requestQueue, billing, toolDeclarations, toolExecutor, promptBuilder
- Import `getAgentById, incrementRunCount` from local `./agentRegistry.js` (same signatures as skillRegistry)
- `StepEvent` interface extracted for `onStepEmit` callback type instead of inline type
- Three emit points: start (kind:'api'), tool call (kind:'rpc'), complete (kind:'finding')
- Query helpers also renamed: `getExecutionsBySkill` → `getExecutionsByAgent`, SQL targets `agent_executions` table
- All pre-existing LSP errors identical to skillExecutor (crypto module, @google/generative-ai, process globals)
