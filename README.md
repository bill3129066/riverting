# Riverting

**AI Agent Marketplace with Streaming Salary on X Layer**

Curators upload AI agents. Users interact via conversational chat or pay-per-second sessions. Proof stops, payment stops.

## Quick Start

```bash
# One command to start everything
./run.bash

# Or manually:
pnpm install
cd backend && bun run src/db/init.ts && bun run src/server.ts &
cd frontend && pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### Environment

Copy `.env.example` to `.env` and fill in:

```
GEMINI_API_KEY=your-key-here    # Required — get from https://aistudio.google.com/apikey
PORT=3001
```

## Features

### Agent Marketplace (`/skills`)
- Browse, search, and filter AI agents by category (DeFi, Trading, NFT, Security)
- 19 pre-loaded agents from 4 skill packs (seeded from `skills/` directory on DB init)
- Upload custom agents via form or import SKILL.md directory format
- Per-second pricing with USDC billing
- Star rating system (1-5) with averages

### Conversational Chat (`/skills/[id]`)
- **Chat mode** — multi-turn conversations with full Gemini history, not single-shot
- Dynamic input forms auto-generated from JSON Schema for initial parameters
- Follow-up questions maintain full conversation context
- **Demo / Wallet mode toggle** — test without connecting wallet, or use full wallet auth
- Chat history persisted in localStorage
- **RPC Tool Use** — DeFi/Security agents have Gemini function calling with 8 on-chain RPC tools:
  - `eth_blockNumber`, `eth_getBalance`, `eth_getCode`, `eth_call`
  - `eth_getLogs`, `eth_getStorageAt`, `eth_getTransactionReceipt`, `eth_getBlockByNumber`
  - Gemini autonomously reads blockchain data during analysis
- **Google Search grounding** — non-tool agents use Google Search for real-time data on any chain (Sui, Solana, etc.)
- **Scope-aware prompts** — EVM queries use RPC tools; non-EVM queries use search without hallucinating EVM data
- Execution history with All/Mine filtering

### Agent Upload (`/upload`)
- **Manual Form** — Name, description, system prompt, user prompt template with `{{variable}}` auto-detection, model/temperature config
- **Import SKILL.md** — Upload standardized skill directory (SKILL.md + patterns/*.md), auto-creates master agent + pattern sub-agents
- **Auto-compression** — Gemini compresses large skill prompts to fit token budgets, original preserved in DB

### Multi-User Isolation
- **Wallet signature verification** (EIP-191 personal_sign) on all write operations
- **Per-wallet rate limiting** — token bucket with IP fallback for demo mode
- **Execution history permissions** — creator sees all, user sees own, anonymous gets metadata only
- **Gemini concurrency queue** — max 3 concurrent API calls (semaphore with 30s timeout)

### Live Agent Sessions (`/session/[id]`)
- Real-time streaming salary ticker (USDC per second)
- Live agent work timeline (SSE: steps, proofs, earnings)
- MAGI consensus engine animation
- Chat with agent (Gemini-powered, markdown rendering)
- Proof heartbeat — on-chain liveness signal, no proof = no pay
- Review overlay with star rating on session end

### Settings (`/settings`)
- On-chain USDC deposit via ERC20.transfer
- Multi-network support (X Layer Testnet)
- Platform balance display

## Pre-loaded Skill Packs

| Pack | Agents | Tools | Category |
|---|---|---|---|
| **DeFi On-Chain Analytics** | 7 (master + 6 patterns: wallet, DEX, token, protocol, CLAMM vault, contract) | RPC + Google Search | DeFi |
| **Smart Contract Security** | 4 (master + reentrancy, access control, flash loan) | RPC | Security |
| **Trading Signal Engine** | 3 (master + momentum, risk management) | Google Search | Trading |
| **NFT Market Intelligence** | 3 (master + collection analysis, whale tracking) | Google Search | NFT |

## Architecture

```
contracts/     — Solidity (RivertingEscrow — registry + escrow + proofs)
backend/       — Hono + Bun + SQLite
  api/           — REST routes (agents, sessions, curator, queries)
  middleware/    — Signature verification, rate limiting
  services/
    agent/       — Agent registry, executor (chat + tool-use loop)
    skill/       — Prompt builder, compressor, tool declarations, RPC executor
    session/     — Live session orchestrator, billing, SSE hub
    proof/       — Proof relayer (on-chain heartbeat)
skills/        — Skill packs (SKILL.md + patterns/*.md, auto-seeded on DB init)
frontend/      — Next.js 14 + Tailwind + RainbowKit + wagmi
  /skills        — Agent marketplace
  /skills/[id]   — Agent detail + conversational chat
  /upload        — Agent upload (manual + SKILL.md import)
  /marketplace   — Browse agents
  /session/[id]  — Live agent session with MAGI
  /settings      — Wallet deposit + network config
```

## Stack

- **Chain**: X Layer Testnet (OP Stack, near-zero gas)
- **Payment**: USDC streaming per-second + per-execution billing
- **AI**: Google Gemini 2.5 Flash with function calling + Google Search grounding
- **On-Chain Data**: Direct RPC via viem (Ethereum, Arbitrum, Base, BSC, Polygon, X Layer)
- **Auth**: EIP-191 wallet signatures (wagmi + viem), demo mode for testing
- **Proof**: On-chain heartbeat — no proof = no pay

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/agents` | - | List agents (filter by category, creator, search) |
| GET | `/api/agents/:id` | - | Get agent detail |
| POST | `/api/agents` | Signature | Create agent |
| POST | `/api/agents/:id/chat` | Signature | Chat with agent (authenticated) |
| POST | `/api/agents/:id/chat-demo` | - | Chat with agent (demo, rate limited by IP) |
| POST | `/api/agents/:id/rate` | Signature | Rate agent (1-5) |
| GET | `/api/agents/:id/executions` | - | Execution history |
| GET | `/api/agents/billing/balance` | - | Get wallet balance |
| POST | `/api/agents/billing/deposit` | Signature | Deposit funds |
| POST | `/api/sessions` | Signature | Start live session |
| POST | `/api/sessions/:id/chat` | - | Chat in session |
| GET | `/api/sessions/:id/stream` | - | SSE event stream |

## Tests

```bash
cd backend && bun test          # 30/30 tests pass
cd contracts && forge test      # Contract tests
```

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Skill Upload Architecture](docs/SKILL_UPLOAD_ARCHITECTURE.md)
- [Test Flows](docs/TEST_FLOWS.md)
