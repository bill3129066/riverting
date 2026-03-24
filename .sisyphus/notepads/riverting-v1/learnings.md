- Foundry on this environment warns for `[profile.default.rpc_endpoints]`; build/test still pass with provided task config.
- TDD flow succeeded: writing event/assert-heavy registry tests first made implementation straightforward and validated permissions early.
- Keeping `SafeERC20` and `ReentrancyGuard` imported now avoids later churn when session/settlement logic is added in subsequent tasks.
- Session accrual correctness required modeling two segments in fuzz assertions when a proof is submitted: pre-proof accrual checkpoint plus post-proof accrual until `min(now, lastProofAt + proofWindow)`.
- For share accounting invariant checks, integer division introduces rounding dust; asserting `totalAccrued - (curatorShare + platformShare) <= 1` is robust under truncation.

## Frontend Scaffolding
- Next.js 14 requires `next.config.js` instead of `next.config.ts` because `.ts` configuration is a Next.js 15+ feature.
- Wagmi + RainbowKit setup requires wrapping providers appropriately (`WagmiProvider`, `QueryClientProvider`, `RainbowKitProvider`).

## Backend Scaffolding
- `better-sqlite3` is NOT supported in Bun (as of v1.3.4). Use `bun:sqlite` instead — same synchronous API, built-in, zero deps.
- `bun:sqlite` uses `$param` prefix for named parameters (not `@param` like better-sqlite3).
- `bun:sqlite` `Statement.run()` returns void; use `SELECT last_insert_rowid()` to get insert ID.
- Add `"types": ["bun-types"]` to tsconfig.json for `bun:sqlite` type resolution.
- SQLite WAL files (`*.db-shm`, `*.db-wal`) need explicit gitignore patterns — `*.db` alone doesn't catch them.
- Implemented live session page with Server-Sent Events (SSE) streaming state (agent output, proofs, metrics). Used `crypto.randomUUID()` or unique composite keys for realtime lists.
