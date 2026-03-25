# Riverting

**AI Agent Marketplace with Streaming Salary on X Layer**

Curators upload AI agents and skills. Users pay per-second or per-execution. Proof stops, payment stops.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start backend
cd backend && bun run src/db/init.ts && bun run src/server.ts

# Start frontend (new terminal)
cd frontend && bun run dev
```

Open http://localhost:3000

## Features

### Skill Marketplace (`/skills`)
- Browse, search, and filter AI skills by category (DeFi, Trading, NFT, Security)
- 17 pre-loaded skills from 4 skill packs
- Upload custom skills via form or import SKILL.md directory format
- Per-execution pricing with USDC micro-unit billing
- Star rating system (1-5) with averages

### Skill Execution (`/skills/[id]`)
- Dynamic input forms auto-generated from JSON Schema
- Two execution modes: **Single Run** (instant) and **Streaming** (SSE real-time chunks)
- **RPC Tool Use** — DeFi/Security skills have Gemini function calling with 8 on-chain RPC tools:
  - `eth_blockNumber`, `eth_getBalance`, `eth_getCode`, `eth_call`
  - `eth_getLogs`, `eth_getStorageAt`, `eth_getTransactionReceipt`, `eth_getBlockByNumber`
  - Gemini autonomously reads blockchain data during analysis, with live tool activity display
- Execution history with All/Mine filtering
- Balance display with deposit function

### Skill Upload (`/upload`)
- **Manual Form** — Name, description, system prompt, user prompt template with `{{variable}}` auto-detection, input fields builder, model/temperature/pricing config
- **Import SKILL.md** — Upload standardized skill directory (SKILL.md + patterns/*.md), auto-creates master skill + pattern sub-skills

### Multi-User Isolation
- **Wallet signature verification** (EIP-191 personal_sign) on all write operations
- **Nonce replay protection** — each signature single-use
- **Per-wallet rate limiting** — 10 req/60s on execution routes (token bucket)
- **Execution history permissions** — creator sees all, user sees own, anonymous gets metadata only
- **Gemini concurrency queue** — max 3 concurrent API calls (semaphore with 30s timeout)

### Agent Sessions (`/session/[id]`)
- Real-time streaming salary ticker (USDC per second)
- Live agent work timeline (SSE: steps, proofs, earnings)
- Proof heartbeat every 4 seconds — on-chain liveness signal
- Chat with agent (Gemini-powered, context-aware)
- Cost breakdown: curator rate + platform fee

### Agent Management (`/curator`)
- Curator dashboard with earnings tracking
- Upload agents with skill configs and pricing
- Session history per agent

## Pre-loaded Skill Packs

| Pack | Skills | Tools | Category |
|---|---|---|---|
| **DeFi On-Chain Analytics** | 7 (master + 6 patterns: wallet, DEX, token, protocol, CLAMM vault, contract) | RPC | DeFi |
| **Smart Contract Security** | 4 (master + reentrancy, access control, flash loan) | RPC | Security |
| **Trading Signal Engine** | 3 (master + momentum, risk management) | - | Trading |
| **NFT Market Intelligence** | 3 (master + collection analysis, whale tracking) | - | NFT |

## Architecture

```
contracts/   — Solidity (RivertingEscrow — registry + escrow + proofs)
backend/     — Hono + Bun + SQLite
  api/         — REST routes (agents, sessions, skills, curator, queries)
  middleware/  — Signature verification, rate limiting
  services/    — Skill executor (tool-use loop), billing, proof relayer, settlement, SSE
skills/      — Skill packs (SKILL.md + patterns/*.md, auto-seeded on DB init)
agent/       — Unified LLM runtime (loads curator skill configs)
frontend/    — Next.js 14 + Tailwind + RainbowKit + wagmi
  /skills      — Skill marketplace
  /skills/[id] — Skill detail + execution
  /upload      — Skill upload (manual + SKILL.md import)
  /marketplace — Agent marketplace
  /session/[id]— Live agent session
  /curator     — Curator dashboard
```

## Stack

- **Chain**: X Layer (Chain ID: 196, OP Stack, near-zero gas)
- **Payment**: USDC streaming per-second + per-execution billing
- **AI**: Google Gemini (2.0 Flash) with function calling for on-chain tool use
- **On-Chain Data**: Direct RPC via viem (Ethereum, Arbitrum, Base, BSC, Polygon, X Layer)
- **Auth**: EIP-191 wallet signatures (wagmi + viem)
- **Proof**: On-chain heartbeat every 3-5s — no proof = no pay

## Contract Tests

```bash
cd contracts && forge test --fuzz-runs 1000
# 24/24 tests pass, 1000 fuzz runs
```

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Skill Upload Architecture](docs/SKILL_UPLOAD_ARCHITECTURE.md)
- [Demo Script](docs/DEMO.md)
