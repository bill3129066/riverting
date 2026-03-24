# Riverting

**Streaming Salary for AI Agents on X Layer**

AI agents get paid per-second for real on-chain work. Proof stops, payment stops.

## Architecture

- `contracts/` — Solidity (AgentPayrollEscrow)
- `backend/` — Node.js orchestrator + x402 paywall
- `frontend/` — Next.js dashboard
- `agent/` — DeFi Analyst agent (OnchainOS + LLM)

## Stack

- **Chain**: X Layer (Chain ID: 196, OP Stack)
- **Payment**: USDC streaming + x402 pay-per-query
- **Data**: OKX OnchainOS APIs (Market/Trade/Wallet)
- **AI**: Claude / GPT for DeFi analysis
