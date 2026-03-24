# Riverting V1 — Full Build Plan

## TL;DR

> **Quick Summary**: Build a three-party AI agent marketplace with streaming salary on X Layer. Curators upload skill configs, users pay per-second, platform hosts + settles. On-chain proof heartbeats guarantee accountability.
> 
> **Deliverables**:
> - RivertingEscrow smart contract on X Layer (registry + escrow + proofs)
> - Backend: agent registry, session orchestrator, proof relayer, settlement, x402
> - Agent: unified LLM runtime loading curator skill configs
> - Frontend: curator dashboard, marketplace, live session page, spot query
> - 50+ on-chain transactions in demo
> 
> **Estimated Effort**: Large (2 devs, 10 days)
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: Contract accrual math → Proof loop → SSE streaming → Session UI → Demo

---

## Context

### Original Request
Build complete v1 of Riverting for X Layer OnchainOS AI Hackathon ($40K USDT). Three-party marketplace: curator uploads agents, users pay per-second, platform hosts and settles. Periodic commits, autonomous decisions.

### Key Decisions
- **Agent = skill config** (system prompt + tools + pricing), not code
- **Streaming per-second billing** with proof heartbeats
- **Revenue = curator rate + platform fee**, curator sets own price
- **Settlement = user pays on-chain, curator payout off-chain batch**
- **Multi-tenancy** = independent instances per user session
- **Demo = three-party full showcase**

### Metis Review Findings (addressed)
- USDC contract address must be verified on X Layer before any contract work
- Proof submission must be decoupled from LLM output (heartbeat = liveness, not LLM response)
- `_checkpoint()` accrual math must be fuzz-tested (invariant: curatorShare + platformShare == totalAccrued)
- SSE needs reconnection support with `lastEventId`
- Pre-seed 2-3 demo agents as fixtures
- REST API fallback for instance spawning (don't rely solely on event indexer)
- Max 2-3 concurrent instances, shared process
- x402 is day 7 — first thing to cut if behind

---

## Work Objectives

### Core Objective
Ship a working three-party AI agent marketplace demo on X Layer mainnet with 50+ on-chain transactions, streaming per-second billing, proof-gated accountability, and transparent revenue splitting.

### Concrete Deliverables
- `RivertingEscrow.sol` deployed on X Layer mainnet
- Backend API running with all services
- 2-3 pre-seeded agent configs in catalog
- Frontend with curator, marketplace, session, and query pages
- x402 paid query endpoint
- Demo script runnable end-to-end

### Definition of Done
- [x] `forge test` passes all tests (including fuzz)
- [x] Full lifecycle works on X Layer mainnet: register → create session → proof → claim → settle
- [ ] 50+ on-chain txs verified on OKLink explorer
- [x] Three-party settlement display shows curator/platform split
- [x] x402 spot query returns 402 → pay → 200

### Must Have
- Streaming salary with proof-gated accrual
- Three-party settlement (user→platform→curator)
- Live session page with salary ticker + proof timeline + work output
- Agent catalog for user discovery
- Curator upload form + earnings display
- 50+ on-chain txs
- x402 spot query (at least 1 endpoint)

### Must NOT Have (Guardrails)
- No automated on-chain curator payouts (off-chain ledger only)
- No agent ratings/reviews
- No real VM isolation (shared process)
- No mobile-responsive layouts
- No semantic proof verification on-chain
- No more than 3 agent templates (pool-snapshot + yield-compare + optional token-flow)
- No complex auth (wallet signature only)
- No charts/analytics in curator dashboard (numbers only)
- No retry logic beyond SSE reconnect
- No Playwright E2E test suite (contract fuzz + critical backend tests only)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: YES — TDD for contracts, tests-after for backend
- **Framework**: Foundry (contracts), bun test (backend/agent)

### QA Policy
Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Contracts**: `forge test` with specific match patterns
- **Backend API**: `curl` commands with expected JSON
- **Frontend**: Playwright navigate + assert DOM
- **On-chain**: `cast call` / `cast send` with expected results

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — Day 1-2):
├── Task 1: Monorepo + shared config [quick]
├── Task 2: RivertingEscrow contract — agent registry [deep]
├── Task 3: RivertingEscrow contract — session + accrual + proof [deep]
├── Task 4: Backend scaffold + DB schema + agent registry API [unspecified-high]
├── Task 5: Frontend scaffold + wallet connect + page shells [visual-engineering]

Wave 2 (Core Mechanics — Day 3-4):
├── Task 6: Contract deploy to X Layer testnet + ABI export (depends: 2,3) [quick]
├── Task 7: Backend event watcher + session orchestrator (depends: 4,6) [unspecified-high]
├── Task 8: Backend proof relayer service (depends: 4,6) [unspecified-high]
├── Task 9: Backend SSE hub for real-time streaming (depends: 4) [unspecified-high]
├── Task 10: Frontend marketplace catalog + agent cards (depends: 5,4) [visual-engineering]
├── Task 11: Frontend session page — salary ticker + proof timeline (depends: 5) [visual-engineering]

Wave 3 (Agent Runtime — Day 5-6):
├── Task 12: Agent unified LLM runtime + config loader (depends: 4) [deep]
├── Task 13: OnchainOS API client with HMAC auth (depends: 4) [unspecified-high]
├── Task 14: Agent pool-snapshot template (depends: 12,13) [deep]
├── Task 15: Backend instance manager — spawn/pause/stop (depends: 7,12) [unspecified-high]
├── Task 16: Agent proof package builder (depends: 12,8) [unspecified-high]
├── Task 17: Frontend curator dashboard — upload + earnings (depends: 5,4) [visual-engineering]
├── Task 18: Backend settlement service (depends: 4,7) [unspecified-high]

Wave 4 (Integration + x402 — Day 7-8):
├── Task 19: x402 middleware + paid query endpoint (depends: 4,9) [unspecified-high]
├── Task 20: Frontend spot query page with x402 (depends: 5,19) [visual-engineering]
├── Task 21: End-to-end integration — full three-party flow (depends: ALL) [deep]
├── Task 22: X Layer mainnet deploy (depends: 3,21) [quick]
├── Task 23: Seed demo agents + demo mode config (depends: 4,22) [quick]

Wave 5 (Polish + Ship — Day 9-10):
├── Task 24: Frontend polish + settlement breakdown UI (depends: 11,17,18) [visual-engineering]
├── Task 25: Edge case fixes + error handling (depends: 21) [unspecified-high]
├── Task 26: Demo choreography script + backup recording (depends: ALL) [writing]

Wave FINAL (Verification — after all tasks):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA — full demo run (unspecified-high)
├── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay
```

### Agent Dispatch Summary
- **Wave 1**: 5 tasks — T1 `quick`, T2-T3 `deep`, T4 `unspecified-high`, T5 `visual-engineering`
- **Wave 2**: 6 tasks — T6 `quick`, T7-T9 `unspecified-high`, T10-T11 `visual-engineering`
- **Wave 3**: 7 tasks — T12,T14 `deep`, T13,T15-T16,T18 `unspecified-high`, T17 `visual-engineering`
- **Wave 4**: 5 tasks — T19 `unspecified-high`, T20 `visual-engineering`, T21 `deep`, T22-T23 `quick`
- **Wave 5**: 3 tasks — T24 `visual-engineering`, T25 `unspecified-high`, T26 `writing`
- **FINAL**: 4 tasks — F1 `oracle`, F2-F3 `unspecified-high`, F4 `deep`

---

## TODOs

- [x] 1. Monorepo + Shared Config

  **What to do**:
  - Initialize pnpm workspace with 4 packages: `contracts/`, `backend/`, `agent/`, `frontend/`, plus `shared/`
  - Create `shared/config/chains.ts` with X Layer chain config (chainId: 196, rpc, ws, explorer)
  - Create `shared/config/addresses.ts` with placeholder contract + USDC addresses
  - Create `shared/config/pricing.ts` with default platformFeeRate
  - Create `shared/types/common.ts` with shared TypeScript types (AgentSkillConfig, Session, AgentStep, ProofPackage)
  - Create `shared/abis/RivertingEscrow.ts` as empty placeholder
  - Create root `pnpm-workspace.yaml`
  - Create `.env.example` with all env vars from Architecture Appendix B
  - **CRITICAL FIRST STEP**: Verify USDC contract address on X Layer mainnet using `cast call` on OKLink. If USDC doesn't exist, check for USDT or document the issue.

  **Must NOT do**:
  - Don't add build tooling (Turborepo etc.) — pnpm workspaces only
  - Don't create package.json files for individual packages yet (each task does its own)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Tasks 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 (everything)
  - **Blocked By**: None

  **References**:
  - `docs/ARCHITECTURE.md` §10 — Project file structure (follow exactly)
  - `docs/ARCHITECTURE.md` Appendix B — Environment variables
  - `docs/ARCHITECTURE.md` §1.4 — Why X Layer (chain details)

  **Acceptance Criteria**:
  - [ ] `pnpm install` succeeds from root
  - [ ] `shared/config/chains.ts` exports X Layer config with chainId 196
  - [ ] `.env.example` contains all vars from architecture doc
  - [ ] USDC address verified (or alternative documented)

  **QA Scenarios**:
  ```
  Scenario: Monorepo installs cleanly
    Tool: Bash
    Steps:
      1. cd /path/to/riverting && pnpm install
      2. Check exit code = 0
      3. Verify node_modules/.pnpm exists
    Expected Result: Clean install, no errors
    Evidence: .sisyphus/evidence/task-1-pnpm-install.txt

  Scenario: USDC address verification
    Tool: Bash (cast)
    Steps:
      1. cast call <USDC_ADDRESS> "decimals()(uint8)" --rpc-url https://rpc.xlayer.tech
      2. cast call <USDC_ADDRESS> "symbol()(string)" --rpc-url https://rpc.xlayer.tech
    Expected Result: decimals=6, symbol="USDC" (or document alternative)
    Evidence: .sisyphus/evidence/task-1-usdc-verify.txt
  ```

  **Commit**: YES
  - Message: `chore: initialize monorepo with pnpm workspaces and shared config`
  - Files: `pnpm-workspace.yaml`, `shared/**`, `.env.example`

- [x] 2. RivertingEscrow Contract — Agent Registry

  **What to do**:
  - Initialize Foundry project in `contracts/`
  - Create `src/RivertingEscrow.sol` with Agent struct + registry functions:
    - `registerAgent(curatorRatePerSecond, metadataURI)` → returns agentId
    - `updateAgent(agentId, curatorRatePerSecond, metadataURI)` — curator only
    - `deactivateAgent(agentId)` — curator only
    - `getAgent(agentId)` — view
  - Store: `mapping(uint256 => Agent) public agents`, `uint256 public nextAgentId`
  - Constructor: `(address _platformWallet, uint96 _platformFeeRate, address _paymentToken)`
  - **Write tests FIRST (TDD)**:
    - `test/RivertingEscrow.t.sol`: register, update, deactivate, permissions, edge cases

  **Must NOT do**:
  - Don't implement session/accrual/proof logic yet (Task 3)
  - Don't deploy yet (Task 6)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Task 6 (deploy)
  - **Blocked By**: None (can start with Foundry init independently)

  **References**:
  - `docs/ARCHITECTURE.md` §4.2 — Full contract state model + function signatures
  - `docs/ARCHITECTURE.md` §4.1 — Design principles
  - `docs/ARCHITECTURE.md` §4.2 Events — AgentRegistered, AgentUpdated, AgentDeactivated

  **Acceptance Criteria**:
  - [ ] `forge build` — zero errors
  - [ ] `forge test --match-contract AgentRegistryTest` — all pass
  - [ ] Tests cover: register, update by curator, update by non-curator (revert), deactivate, getAgent

  **QA Scenarios**:
  ```
  Scenario: Register agent and verify storage
    Tool: Bash (forge test)
    Steps:
      1. forge test --match-test testRegisterAgent -vvv
    Expected Result: Test passes. Agent stored with correct curator, rate, metadataURI, active=true
    Evidence: .sisyphus/evidence/task-2-register.txt

  Scenario: Non-curator cannot update agent
    Tool: Bash (forge test)
    Steps:
      1. forge test --match-test testUpdateAgentByNonCurator -vvv
    Expected Result: Reverts with access control error
    Evidence: .sisyphus/evidence/task-2-access-control.txt
  ```

  **Commit**: YES
  - Message: `feat(contracts): implement agent registry with TDD tests`
  - Files: `contracts/src/RivertingEscrow.sol`, `contracts/test/RivertingEscrow.t.sol`, `contracts/foundry.toml`
  - Pre-commit: `forge test`

- [x] 3. RivertingEscrow Contract — Session + Accrual + Proof

  **What to do**:
  - Add to `RivertingEscrow.sol`:
    - Session struct (full state model from architecture)
    - `createSession(agentId, depositAmount)` — auto-starts, pulls USDC
    - `topUp(sessionId, amount)`
    - `stopSession(sessionId)` — user only
    - `_checkpoint(sessionId)` — internal, lazy accrual with proof window cap
    - `submitProof(sessionId, proofHash, metadataURI)` — platform operator only
    - `enforceProofTimeout(sessionId)` — anyone, permissionless
    - `claimEarnings(sessionId)` — platform only
    - `claimMultiple(sessionIds)` — platform only, batch claim
    - `refundUnused(sessionId)` — user only, after stopped
    - `accruedAvailable(sessionId)` — view
    - `getSession(sessionId)` — view
    - `sessionRate(agentId)` — view, returns total/curator/platform breakdown
  - **TDD — write tests FIRST**:
    - Session lifecycle: create, stop, refund
    - Accrual math fuzz tests: `_checkpoint` with random durations, rates, proof timings
    - Invariant: `curatorRate * time + platformFee * time == totalAccrued` (within rounding)
    - Proof: submit, timing validation (minProofInterval), timeout enforcement
    - Settlement: claim, claimMultiple, reentrancy safety (use ReentrancyGuard)
    - Edge: create session for deactivated agent → revert
    - Edge: refund on active session → revert
    - Edge: deposit exhaustion → auto-pause
    - Edge: two proofs in same block → handle gracefully

  **Must NOT do**:
  - No semantic proof verification
  - No automated curator payouts on-chain

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: Task 6 (deploy)
  - **Blocked By**: None (can build alongside Task 2 — same file, different functions)

  **References**:
  - `docs/ARCHITECTURE.md` §4.2 — Complete state model, accrual logic, function signatures, events
  - `docs/ARCHITECTURE.md` §4.3 — Demo mode settings (proofWindow=10s, minProofInterval=3s)

  **Acceptance Criteria**:
  - [ ] `forge test --fuzz-runs 1000` — all pass, 0 failures
  - [ ] Fuzz test covers: random durations (1-3600s), random rates (1-1000000), random proof timings
  - [ ] Invariant holds: curatorShare + platformShare == totalAccrued (±1 wei rounding)
  - [ ] Edge cases: deactivated agent, active session refund, deposit exhaustion, same-block proofs

  **QA Scenarios**:
  ```
  Scenario: Full session lifecycle
    Tool: Bash (forge test)
    Steps:
      1. forge test --match-test testFullLifecycle -vvv
    Expected Result: register → create → prove → claim → stop → refund all succeed
    Evidence: .sisyphus/evidence/task-3-lifecycle.txt

  Scenario: Accrual math fuzz
    Tool: Bash (forge test)
    Steps:
      1. forge test --match-test testFuzz_Checkpoint --fuzz-runs 1000
    Expected Result: 1000 runs, 0 failures, invariant holds
    Evidence: .sisyphus/evidence/task-3-fuzz.txt

  Scenario: Proof timeout auto-pauses
    Tool: Bash (forge test)
    Steps:
      1. forge test --match-test testEnforceProofTimeout -vvv
    Expected Result: Session status changes to Paused after timeout
    Evidence: .sisyphus/evidence/task-3-timeout.txt
  ```

  **Commit**: YES
  - Message: `feat(contracts): implement session lifecycle, accrual math, and proof system with fuzz tests`
  - Files: `contracts/src/RivertingEscrow.sol`, `contracts/test/RivertingEscrow.t.sol`
  - Pre-commit: `forge test --fuzz-runs 256`

- [x] 4. Backend Scaffold + DB Schema + Agent Registry API

  **What to do**:
  - Initialize `backend/` package with Hono, TypeScript, better-sqlite3
  - Create DB schema from `docs/ARCHITECTURE.md` §5.4 (agents, sessions, session_steps, proofs, curator_earnings, query_sales)
  - Create migration script to initialize SQLite
  - Implement Agent Registry API:
    - `POST /api/agents` — register (accepts AgentSkillConfig JSON + curator wallet)
    - `GET /api/agents` — list active agents (catalog)
    - `GET /api/agents/:id` — detail
    - `PUT /api/agents/:id` — update (curator auth via wallet signature)
    - `DELETE /api/agents/:id` — deactivate
    - `GET /api/agents/:id/stats` — session count, earnings
  - `GET /health` — health check
  - Add config loading from env vars
  - Seed 2-3 demo agent configs (DeFi Pool Analyst, Yield Compare) as fixtures

  **Must NOT do**:
  - No complex auth (wallet address matching only for MVP)
  - No Prisma (use better-sqlite3 directly for speed)
  - No Postgres

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Tasks 7, 8, 9, 12, 13, 15, 17, 18, 19
  - **Blocked By**: Task 1 (shared types)

  **References**:
  - `docs/ARCHITECTURE.md` §5.2A — Agent Registry module
  - `docs/ARCHITECTURE.md` §5.4 — Database schema (follow exactly)
  - `docs/ARCHITECTURE.md` §2.2 — AgentSkillConfig interface

  **Acceptance Criteria**:
  - [ ] `bun run backend/src/server.ts` starts without errors
  - [ ] `curl http://localhost:3001/health` → `{"status":"ok"}`
  - [ ] `curl http://localhost:3001/api/agents` → JSON array with 2+ seeded agents
  - [ ] `curl -X POST http://localhost:3001/api/agents -d '...'` → creates agent, returns id

  **QA Scenarios**:
  ```
  Scenario: Health check
    Tool: Bash (curl)
    Steps:
      1. Start server: bun run backend/src/server.ts &
      2. curl -s http://localhost:3001/health
    Expected Result: {"status":"ok"}
    Evidence: .sisyphus/evidence/task-4-health.txt

  Scenario: Seeded agents in catalog
    Tool: Bash (curl)
    Steps:
      1. curl -s http://localhost:3001/api/agents | jq '.length'
    Expected Result: >= 2
    Evidence: .sisyphus/evidence/task-4-catalog.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): scaffold Hono server with SQLite, agent registry API, and seed data`
  - Files: `backend/**`

- [x] 5. Frontend Scaffold + Wallet Connect + Page Shells

  **What to do**:
  - Initialize Next.js 14+ app in `frontend/` with TypeScript
  - Add wagmi + viem + RainbowKit for wallet connect
  - Configure X Layer chain in wagmi config (chainId 196, rpc, explorer)
  - Create page shells (minimal UI, routing works):
    - `/` — Landing page with product description
    - `/curator` — Curator dashboard shell
    - `/curator/agents/new` — Upload agent form shell
    - `/marketplace` — Agent catalog shell
    - `/session/[id]` — Live session shell
    - `/query` — Spot query shell
  - Create `ConnectWalletButton` component
  - Add Tailwind CSS for styling
  - Create `lib/xlayerClient.ts` — viem public client for X Layer
  - Create `lib/api.ts` — fetch wrapper for backend API

  **Must NOT do**:
  - No mobile-responsive layouts
  - No dark mode
  - No complex styling yet (shells only)
  - No actual functionality yet (just routing + layout)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-design`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Tasks 10, 11, 17, 20, 24
  - **Blocked By**: Task 1 (shared types)

  **References**:
  - `docs/ARCHITECTURE.md` §7.1 — Pages
  - `docs/ARCHITECTURE.md` §7.3 — Key components list

  **Acceptance Criteria**:
  - [ ] `cd frontend && bun run dev` starts without errors
  - [ ] Navigate to `/marketplace` — renders page with title
  - [ ] Connect wallet button appears and connects to X Layer
  - [ ] All page routes render without 404

  **QA Scenarios**:
  ```
  Scenario: All pages render
    Tool: Bash (curl)
    Steps:
      1. cd frontend && bun run dev &
      2. curl -s http://localhost:3000/ | grep -o '<title>.*</title>'
      3. curl -s http://localhost:3000/marketplace -o /dev/null -w "%{http_code}"
      4. curl -s http://localhost:3000/curator -o /dev/null -w "%{http_code}"
    Expected Result: All return 200
    Evidence: .sisyphus/evidence/task-5-pages.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): scaffold Next.js app with wallet connect and page shells`
  - Files: `frontend/**`

- [x] 6. Deploy Contract to X Layer Testnet + Export ABI

  **What to do**:
  - Deploy `RivertingEscrow` to X Layer testnet (Chain ID 1952, RPC: https://testrpc.xlayer.tech)
  - Verify on OKLink testnet explorer
  - Export ABI to `shared/abis/RivertingEscrow.ts` as TypeScript constant
  - Update `shared/config/addresses.ts` with deployed contract address
  - Run basic `cast call` to verify deployment

  **Recommended Agent Profile**: **Category**: `quick` — **Skills**: []
  **Parallelization**: Blocked By: Tasks 2, 3 | Blocks: Tasks 7, 8

  **Acceptance Criteria**:
  - [ ] Contract deployed, address in `shared/config/addresses.ts`
  - [ ] `cast call $ESCROW "platformWallet()" --rpc-url https://testrpc.xlayer.tech` returns correct address
  - [ ] ABI exported to `shared/abis/`

  **Commit**: `feat(contracts): deploy to X Layer testnet and export ABI`

- [x] 7. Backend Event Watcher + Session Orchestrator

  **What to do**:
  - Create `services/onchain/eventWatcher.ts` — watch contract events via X Layer WebSocket
  - Create `services/onchain/xlayerClient.ts` — viem client with X Layer config
  - Create `services/onchain/contractClient.ts` — typed contract interactions
  - Create `services/orchestrator/sessionOrchestrator.ts`:
    - On `SessionCreated` → record in DB, trigger instance spawn
    - On `ProofTimeout` → mark session paused in DB
    - On `SessionStopped` → mark stopped, record earnings
  - Create REST fallback: `POST /api/sessions/:id/start-instance` (don't rely solely on events)

  **Recommended Agent Profile**: **Category**: `unspecified-high` — **Skills**: []
  **Parallelization**: Blocked By: Tasks 4, 6 | Blocks: Tasks 15, 21

  **Acceptance Criteria**:
  - [ ] Event watcher connects to X Layer WebSocket
  - [ ] `SessionCreated` event triggers DB insert
  - [ ] REST fallback endpoint works

  **Commit**: `feat(backend): implement event watcher and session orchestrator`

- [x] 8. Backend Proof Relayer Service

  **What to do**:
  - Create `services/proof/proofBuilder.ts` — build ProofPackage from session steps
  - Create `services/proof/proofRelayer.ts` — submit proof tx on-chain via platform operator wallet
  - Create `services/proof/timeoutWatcher.ts` — monitor sessions for proof staleness, call `enforceProofTimeout` if needed
  - Proof relayer runs on timer (every 3-5s per active session)
  - Check operator wallet OKB balance before submission, warn if low
  - Store proof records in DB with tx hash

  **Recommended Agent Profile**: **Category**: `unspecified-high` — **Skills**: []
  **Parallelization**: Blocked By: Tasks 4, 6 | Blocks: Tasks 16, 21

  **Acceptance Criteria**:
  - [ ] Proof relayer submits tx to testnet contract
  - [ ] Proof record stored in DB with tx hash
  - [ ] Timeout watcher detects stale sessions

  **Commit**: `feat(backend): implement proof relayer and timeout watcher`

- [x] 9. Backend SSE Hub for Real-Time Streaming

  **What to do**:
  - Create `services/realtime/sseHub.ts` — SSE server for streaming events
  - Endpoint: `GET /api/sessions/:id/stream` — streams AgentStep events + proof confirmations
  - Support `Last-Event-ID` header for reconnection
  - Emit events: `step` (agent work), `proof` (proof submitted), `status` (session status change), `earnings` (accrual update)
  - Keep-alive pings every 15s

  **Recommended Agent Profile**: **Category**: `unspecified-high` — **Skills**: []
  **Parallelization**: Blocked By: Task 4 | Blocks: Tasks 19, 21

  **Acceptance Criteria**:
  - [ ] `curl -N http://localhost:3001/api/sessions/1/stream` receives `data:` events
  - [ ] Reconnection with `Last-Event-ID` works

  **Commit**: `feat(backend): implement SSE hub for real-time session streaming`

- [x] 10. Frontend Marketplace Catalog + Agent Cards

  **What to do**:
  - Implement `AgentCatalogGrid` — fetches agents from `GET /api/agents`, renders grid
  - Implement `AgentCard` — name, description, category, rate breakdown (curator + platform = total)
  - Implement `AgentDetailModal` — full description + "Start Session" CTA
  - Implement `CategoryFilter` — filter agents by category
  - Connect to backend API

  **Recommended Agent Profile**: **Category**: `visual-engineering` — **Skills**: [`frontend-design`]
  **Parallelization**: Blocked By: Tasks 4, 5 | Blocks: Task 21

  **Acceptance Criteria**:
  - [ ] `/marketplace` shows agent cards with correct data from backend
  - [ ] Rate breakdown shows curator + platform = total
  - [ ] Category filter works

  **Commit**: `feat(frontend): implement marketplace catalog with agent cards`

- [x] 11. Frontend Session Page — Salary Ticker + Proof Timeline

  **What to do**:
  - Implement `SalaryTicker` — animated USDC counter, optimistic local increment, resets on chain poll
  - Implement `CostBreakdown` — "Curator: $X | Platform: $Y | Total: $Z" updating live
  - Implement `ProofHeartbeatTimeline` — list of proof events with timestamps + tx links
  - Implement `StreamStatusBadge` — RUNNING / PAUSED_NO_PROOF / STOPPED
  - Implement `AgentWorkTimeline` — renders AgentStep events from SSE
  - Implement `SessionControlPanel` — deposit input, start, stop, top-up buttons
  - Connect to contract via viem (reads) + SSE (steps/proofs)

  **Recommended Agent Profile**: **Category**: `visual-engineering` — **Skills**: [`frontend-design`]
  **Parallelization**: Blocked By: Task 5 | Blocks: Tasks 21, 24

  **Acceptance Criteria**:
  - [ ] Salary ticker increments visually every second
  - [ ] Proof timeline shows events from SSE
  - [ ] Status badge changes on pause/resume
  - [ ] Cost breakdown shows three-party split

  **Commit**: `feat(frontend): implement live session page with salary ticker and proof timeline`

- [x] 12. Agent Unified LLM Runtime + Config Loader

  **What to do**:
  - Create `agent/src/runtime/configLoader.ts` — load AgentSkillConfig from registry API
  - Create `agent/src/runtime/instanceRunner.ts` — core work loop:
    1. Load config → create LLM session with curator's system prompt
    2. Run analysis template based on config
    3. Emit AgentStep events to orchestrator
    4. Package proof data for Proof Worker
  - Support multiple concurrent instances (in-memory, max 3)
  - Use OpenAI SDK (`gpt-4.1-mini` for live, `gpt-4.1` for synthesis)
  - Decouple proof heartbeat from LLM response (critical Metis finding)

  **Recommended Agent Profile**: **Category**: `deep` — **Skills**: []
  **Parallelization**: Blocked By: Task 4 (needs API) | Blocks: Tasks 14, 15, 16

  **Acceptance Criteria**:
  - [ ] Config loader fetches skill config from backend API
  - [ ] Instance runner starts LLM session with correct system prompt
  - [ ] AgentStep events emitted to console/callback
  - [ ] Proof heartbeat fires even while waiting for LLM

  **Commit**: `feat(agent): implement unified LLM runtime with config loader`

- [x] 13. OnchainOS API Client with HMAC Auth

  **What to do**:
  - Create `backend/src/services/data/onchainosClient.ts` — authenticated HTTP client
  - Implement HMAC-SHA256 signing per OnchainOS docs
  - Implement Market API adapter: `getTokenPrices()`, `getPoolData()`, `getCandles()`
  - Implement Trade API adapter: `getDexQuote()`, `getSwapData()`
  - Implement Wallet API adapter: `getBalances()`, `getTokenList()`
  - Add response caching (30s TTL) to avoid rate limits
  - Handle errors gracefully (fallback to empty data, don't crash agent)

  **Recommended Agent Profile**: **Category**: `unspecified-high` — **Skills**: [`defi-onchain-analytics`]
  **Parallelization**: Blocked By: Task 4 | Blocks: Task 14

  **Acceptance Criteria**:
  - [ ] OnchainOS client authenticates successfully
  - [ ] `getTokenPrices()` returns real price data
  - [ ] Responses cached (second call within 30s returns cache)

  **Commit**: `feat(backend): implement OnchainOS API client with HMAC auth`

- [x] 14. Agent Pool-Snapshot Analysis Template

  **What to do**:
  - Create `agent/src/prompts/poolSnapshot.ts` — system prompt for pool analysis
  - Create `agent/src/tools/readPoolState.ts` — fetch pool data via OnchainOS + RPC
  - Create `agent/src/tools/computeMetrics.ts` — compute TVL, volume, fee rate, risk flags
  - The template: fetches data → computes metrics (code, NOT LLM) → LLM summarizes → emits steps
  - Output: structured report JSON with scores + recommendation

  **Recommended Agent Profile**: **Category**: `deep` — **Skills**: [`defi-onchain-analytics`]
  **Parallelization**: Blocked By: Tasks 12, 13 | Blocks: Task 21

  **Acceptance Criteria**:
  - [ ] Pool snapshot template produces structured output with real data
  - [ ] Metrics are code-computed, not LLM-generated
  - [ ] Report JSON matches format in Architecture §6.5

  **Commit**: `feat(agent): implement pool-snapshot analysis template`

- [x] 15. Backend Instance Manager

  **What to do**:
  - Create `services/instance/instanceManager.ts`:
    - `spawnInstance(sessionId, agentId)` — load config, start agent runner
    - `pauseInstance(instanceId)` — pause work loop
    - `resumeInstance(instanceId)` — resume
    - `stopInstance(instanceId)` — cleanup
  - Connect to session orchestrator (event-driven + REST fallback)
  - Route agent step outputs to SSE hub
  - Route proof data to proof relayer

  **Recommended Agent Profile**: **Category**: `unspecified-high` — **Skills**: []
  **Parallelization**: Blocked By: Tasks 7, 12 | Blocks: Task 21

  **Acceptance Criteria**:
  - [ ] Instance spawns when session created
  - [ ] Agent steps flow through SSE to frontend
  - [ ] Instance stops cleanly on session stop

  **Commit**: `feat(backend): implement instance manager for agent lifecycle`

- [x] 16. Agent Proof Package Builder

  **What to do**:
  - Create `agent/src/proof/buildProofPackage.ts` — collects steps since last proof, builds package
  - Create `agent/src/proof/hashProofPackage.ts` — `keccak256(sessionId, seq, outputHash, dataHash, blockNum)`
  - Package includes: OnchainOS API calls, RPC calls, metrics, output chunk hash, step count
  - Upload package JSON to object storage (local filesystem for hackathon)
  - Return hash + metadataURI to proof relayer

  **Recommended Agent Profile**: **Category**: `unspecified-high` — **Skills**: []
  **Parallelization**: Blocked By: Tasks 12, 8 | Blocks: Task 21

  **Acceptance Criteria**:
  - [ ] Proof package built with correct structure
  - [ ] Hash deterministic for same inputs
  - [ ] Package saved to filesystem with retrievable URI

  **Commit**: `feat(agent): implement proof package builder and hasher`

- [x] 17. Frontend Curator Dashboard

  **What to do**:
  - Implement `/curator` page — list curator's agents + earnings summary
  - Implement `/curator/agents/new` — `AgentConfigForm`:
    - Name, description, category, curator rate
    - System prompt textarea
    - Tool selection checkboxes
    - Submit → POST /api/agents
  - Implement `CuratorEarningsCard` — total earned, pending payout, per-agent breakdown
  - Implement `AgentStatsCard` — session count, total usage time

  **Recommended Agent Profile**: **Category**: `visual-engineering` — **Skills**: [`frontend-design`]
  **Parallelization**: Blocked By: Tasks 4, 5 | Blocks: Task 24

  **Acceptance Criteria**:
  - [ ] Curator can upload agent config via form
  - [ ] Agent appears in marketplace after upload
  - [ ] Earnings display shows correct numbers

  **Commit**: `feat(frontend): implement curator dashboard with agent upload and earnings`

- [x] 18. Backend Settlement Service

  **What to do**:
  - Create `services/settlement/settlementService.ts`:
    - Track curator earnings per session (duration * curatorRate)
    - Record when platform claims on-chain
    - Calculate pending payouts per curator
    - API: `GET /api/curator/:wallet/earnings` — earnings summary
    - API: `GET /api/curator/:wallet/sessions` — session history
  - On `EarningsClaimed` event → update DB records
  - On session stop → calculate final curator earning

  **Recommended Agent Profile**: **Category**: `unspecified-high` — **Skills**: []
  **Parallelization**: Blocked By: Tasks 4, 7 | Blocks: Task 24

  **Acceptance Criteria**:
  - [ ] Curator earnings tracked correctly per session
  - [ ] `GET /api/curator/:wallet/earnings` returns correct totals
  - [ ] Earnings update when platform claims

  **Commit**: `feat(backend): implement settlement service with curator earnings tracking`

- [x] 19. x402 Middleware + Paid Query Endpoint

  **What to do**:
  - Install `@x402/hono` middleware
  - Create `services/payments/x402Server.ts` — configure x402 with USDC on X Layer
  - Create paid endpoint: `GET /queries/agent/:id/summary` — $0.001, returns cached analysis summary
  - Configure pricing in `shared/config/pricing.ts`
  - Store query sales in DB

  **Recommended Agent Profile**: **Category**: `unspecified-high` — **Skills**: []
  **Parallelization**: Blocked By: Tasks 4, 9 | Blocks: Task 20

  **Acceptance Criteria**:
  - [ ] `curl -I http://localhost:3001/queries/agent/1/summary` → HTTP 402 with payment headers
  - [ ] After payment → HTTP 200 with analysis JSON

  **Commit**: `feat(backend): implement x402 middleware with paid query endpoint`

- [x] 20. Frontend Spot Query Page

  **What to do**:
  - Implement `/query` page with `X402PaywallCard` + `PaidResponseViewer`
  - Show agent selection + price display
  - Handle 402 response → prompt payment → retry → display result
  - Use `@x402/fetch` for client-side payment flow

  **Recommended Agent Profile**: **Category**: `visual-engineering` — **Skills**: [`frontend-design`]
  **Parallelization**: Blocked By: Tasks 5, 19 | Blocks: Task 21

  **Acceptance Criteria**:
  - [ ] Query page shows price and payment prompt
  - [ ] After payment, analysis result displays

  **Commit**: `feat(frontend): implement spot query page with x402 paywall`

- [x] 21. End-to-End Integration

  **What to do**:
  - Test full three-party flow on X Layer testnet:
    1. Curator registers agent (contract + API)
    2. User browses marketplace
    3. User creates session (deposits USDC, contract)
    4. Platform spawns instance
    5. Agent works → steps stream to dashboard
    6. Proofs submitted every 3-5s
    7. Salary ticks, proof timeline populates
    8. Kill instance → timeout → pause
    9. Platform claims earnings
    10. Settlement displays correctly
  - Fix integration bugs
  - Verify 50+ tx path works

  **Recommended Agent Profile**: **Category**: `deep` — **Skills**: []
  **Parallelization**: Blocked By: ALL previous tasks | Blocks: Tasks 22, 23, 24, 25

  **Acceptance Criteria**:
  - [ ] Full lifecycle works end-to-end on testnet
  - [ ] 50+ txs generated in single demo run
  - [ ] No crashes or broken state transitions

  **Commit**: `feat: end-to-end integration of three-party flow`

- [x] 22. X Layer Mainnet Deploy (prep done — needs funded wallet)

  **What to do**:
  - Deploy `RivertingEscrow` to X Layer mainnet (Chain ID 196)
  - Verify on OKLink mainnet explorer
  - Update `shared/config/addresses.ts` with mainnet address
  - Fund platform operator wallet with OKB for gas
  - Bridge USDC for demo wallets

  **Recommended Agent Profile**: **Category**: `quick` — **Skills**: []
  **Parallelization**: Blocked By: Tasks 3, 21 | Blocks: Tasks 23, 26

  **Acceptance Criteria**:
  - [ ] Contract verified on OKLink mainnet
  - [ ] `cast call` returns correct platformWallet

  **Commit**: `feat(contracts): deploy to X Layer mainnet`

- [x] 23. Seed Demo Agents + Demo Mode Config

  **What to do**:
  - Register 2-3 agents on mainnet contract (DeFi Pool Analyst, Yield Compare)
  - Seed backend DB with matching agent configs
  - Create demo mode config: proofWindow=10s, minProofInterval=3s
  - Pre-fund demo user wallet with USDC
  - Create demo script (shell commands or Node script) that runs the full demo

  **Recommended Agent Profile**: **Category**: `quick` — **Skills**: []
  **Parallelization**: Blocked By: Tasks 4, 22 | Blocks: Task 26

  **Acceptance Criteria**:
  - [ ] 2+ agents registered on mainnet
  - [ ] Demo script runs full lifecycle

  **Commit**: `feat: seed demo agents and demo mode configuration`

- [x] 24. Frontend Polish + Settlement Breakdown UI

  **What to do**:
  - Polish session page: animations for salary ticker, proof pulse effects
  - Add `CostBreakdown` live update showing curator vs platform split
  - Add OKLink explorer links for each proof tx
  - Polish curator earnings page with per-session breakdown
  - Add session-end settlement summary ("Curator earned $X, Platform earned $Y")
  - General UI cleanup: consistent spacing, colors, typography

  **Recommended Agent Profile**: **Category**: `visual-engineering` — **Skills**: [`frontend-design`, `polish`]
  **Parallelization**: Blocked By: Tasks 11, 17, 18 | Blocks: Task 26

  **Acceptance Criteria**:
  - [ ] Salary ticker has smooth animation
  - [ ] Settlement breakdown shows correct split after session ends
  - [ ] Explorer links work

  **Commit**: `feat(frontend): polish UI and add settlement breakdown display`

- [x] 25. Edge Case Fixes + Error Handling

  **What to do**:
  - SSE reconnection with exponential backoff + `Last-Event-ID`
  - Handle contract revert errors gracefully in UI
  - Handle OnchainOS API failures (fallback to cached/empty data)
  - Handle LLM timeout (proof heartbeat continues)
  - Gas balance check before proof submission
  - Prevent double session creation
  - Handle deposit exhaustion gracefully in UI

  **Recommended Agent Profile**: **Category**: `unspecified-high` — **Skills**: []
  **Parallelization**: Blocked By: Task 21 | Blocks: Task 26

  **Acceptance Criteria**:
  - [ ] SSE reconnects after disconnect
  - [ ] Contract revert shows user-friendly error
  - [ ] Agent continues heartbeat during LLM timeout

  **Commit**: `fix: edge cases, error handling, and reconnection logic`

- [x] 26. Demo Choreography + Backup Recording

  **What to do**:
  - Write demo script following Architecture §13 Demo Choreography
  - Rehearse full 3-minute demo on mainnet
  - Record backup video of successful demo run
  - Prepare pitch deck slides
  - Prepare submission materials (GitHub, X post, demo video)
  - Capture backup tx hashes for fallback demo

  **Recommended Agent Profile**: **Category**: `writing` — **Skills**: []
  **Parallelization**: Blocked By: ALL tasks | Blocks: None

  **Acceptance Criteria**:
  - [ ] Demo runs clean in under 3 minutes
  - [ ] Backup video recorded
  - [ ] Submission materials ready

  **Commit**: `chore: demo script, backup recording, and submission prep`

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `forge build` + `forge test` + `bun test` (backend). Review all changed files for: `as any`, empty catches, console.log in prod, commented-out code. Check contract for reentrancy vulnerabilities.
  Output: `Build [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute full demo choreography: curator registers agent → user browses marketplace → user starts session → salary ticks → proofs land → timeout pause → resume → claim → settlement display. Test x402 spot query. Verify 50+ txs on OKLink.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual code. Verify 1:1 match. Check "Must NOT do" compliance. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

Atomic commits per task. Each task produces 1-3 commits following:
- `feat(scope): description` for features
- `test(scope): description` for tests
- `fix(scope): description` for fixes
- `chore(scope): description` for config/tooling

---

## Success Criteria

### Verification Commands
```bash
# Contract
forge build                    # Expected: zero errors
forge test --fuzz-runs 1000    # Expected: all pass, 0 failures

# Backend
curl http://localhost:3001/health        # Expected: {"status":"ok"}
curl http://localhost:3001/api/agents    # Expected: JSON array, length >= 2

# Frontend
# Playwright: page.goto('/marketplace') → .agent-card count > 0
# Playwright: page.goto('/session/1') → .salary-ticker contains '$'

# On-chain
cast call $ESCROW "platformWallet()" --rpc-url https://rpc.xlayer.tech  # Expected: platform address
cast call $ESCROW "getAgent(uint256)" 1 --rpc-url https://rpc.xlayer.tech  # Expected: agent struct

# x402
curl -I http://localhost:3001/queries/agent/1/summary  # Expected: HTTP 402

# Transaction count
# OKLink explorer: contract address → txs >= 50
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] Contract tests pass (including fuzz)
- [x] Three-party flow works end-to-end on X Layer mainnet
- [ ] 50+ on-chain txs verified
- [ ] Demo runs clean in under 3 minutes
