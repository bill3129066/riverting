# Riverting

**AI Agent Marketplace with Streaming Salary on X Layer**

Curators upload AI agents. Users pay per-second. Proof stops, payment stops.

## Three Parties

| Role | What | Revenue |
|---|---|---|
| **Agent Curator** | Uploads skill configs (prompt + tools + pricing) | Earns curator rate/sec |
| **Platform** | Hosts agents, manages billing, submits proofs | Earns platform fee/sec |
| **User** | Browses catalog, uses agents, pays per-second | Pays total rate |

## Architecture

- `contracts/` — Solidity (RivertingEscrow — registry + escrow + proofs)
- `backend/` — Node.js (registry, orchestrator, proof relayer, settlement, x402)
- `agent/` — Unified LLM runtime (loads curator skill configs)
- `frontend/` — Next.js (curator dashboard, marketplace, live session, spot query)

## Stack

- **Chain**: X Layer (Chain ID: 196, OP Stack, near-zero gas)
- **Payment**: USDC streaming per-second + x402 spot queries
- **Data**: OKX OnchainOS APIs (Market/Trade/Wallet)
- **AI**: Claude / GPT via unified runtime
- **Proof**: On-chain heartbeat every 3-5s — no proof = no pay

## Docs

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full technical architecture.
