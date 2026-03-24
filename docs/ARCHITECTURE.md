# Riverting — Architecture Document

**Streaming Salary for AI Agents on X Layer**

> AI DeFi 分析師按秒領薪。用 OnchainOS 做真實鏈上分析，工作一秒付一秒，proof 停了錢就停。

**Target**: X Layer OnchainOS AI Hackathon (40,000 USDT)  
**Team**: 2 devs, 7–10 days  
**Stack**: Next.js + Solidity + Node.js + OnchainOS APIs  

---

## Table of Contents

1. [Product Definition](#1-product-definition)
2. [System Architecture](#2-system-architecture)
3. [Smart Contracts](#3-smart-contracts)
4. [Backend Services](#4-backend-services)
5. [AI Agent Design](#5-ai-agent-design)
6. [Frontend Architecture](#6-frontend-architecture)
7. [x402 Integration](#7-x402-integration)
8. [On-Chain Transaction Strategy](#8-on-chain-transaction-strategy)
9. [Project File Structure](#9-project-file-structure)
10. [10-Day Build Plan](#10-10-day-build-plan)
11. [Risk Mitigation](#11-risk-mitigation)
12. [Demo Choreography](#12-demo-choreography)

---

## 1. Product Definition

### 1.1 One-Liner

> AI agents get paid per-second in USDC on X Layer. Proof-of-work heartbeats keep the stream honest. No proof = no pay.

### 1.2 Dual Payment Modes

| Mode | Mechanism | Use Case | x402 Role |
|---|---|---|---|
| **Retainer** | USDC streaming salary with proof heartbeats | Employer hires AI agent for continuous analysis | On-chain escrow contract |
| **Spot** | Pay-per-query $0.001–$0.01 | Anyone queries the agent's findings | **x402** — HTTP 402 → pay → 200 OK |

### 1.3 Why X Layer

| Advantage | Detail |
|---|---|
| **Near-zero gas** | OKB gas negligible — proof submissions < $0.001 each |
| **Flashblocks** | 200ms preconfirmation for near-instant UX |
| **OnchainOS APIs** | Market/Trade/Wallet APIs — agent doesn't build data adapters from scratch |
| **Real DeFi ecosystem** | OKX ecosystem with DEXes and protocols |
| **x402 native support** | EVM-equivalent, EIP-3009 works directly |
| **WebSocket** | `wss://xlayerws.okx.com` for real-time event streaming |
| **$40K prize pool** | 4× larger than Circle Arc hackathon |

### 1.4 MVP Scope

**Build:**
- Streaming salary contract with proof-gated accrual
- DeFi analyst agent powered by OnchainOS + LLM
- Live dashboard showing work output + salary counter + proof timeline
- x402-gated paid query endpoint
- 50+ on-chain transactions in demo

**Do NOT build:**
- Autonomous agent economy / marketplace
- Semantic proof verification on-chain
- Support for >3 analysis templates
- Decentralized storage (simple DB/S3 for hackathon)
- Multi-agent competition

### 1.5 Hackathon Requirements Mapping

| Requirement | How We Satisfy |
|---|---|
| TX Hash on X Layer mainnet | Contract deployment + proof submissions + claims |
| OnchainOS APIs | Agent uses Market API + Trade API for DeFi data |
| x402 integration | Pay-per-query endpoint |
| AI model integration | Claude/GPT for DeFi analysis + structured output |
| GitHub repo | This repo |
| Project X account | Created for submission |

---

## 2. System Architecture

### 2.1 System Diagram

```
┌──────────────────────────── FRONTEND (Next.js) ────────────────────────────┐
│                                                                             │
│  Employer Dashboard          Live Session Page          Public Query UI     │
│  - connect wallet            - agent worklog            - ask premium Q     │
│  - approve USDC              - salary ticker            - x402 paywall      │
│  - create/start stream       - proof timeline           - response view     │
│  - pause/resume/stop         - stream status            - payment receipt   │
│                                                                             │
└──────────┬──────────────────────────┬──────────────────────────┬───────────┘
           │ REST / SSE               │ viem reads               │ HTTP/x402
           ▼                          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js / TypeScript)                       │
│                                                                             │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ Session          │  │ Proof Worker │  │ Event      │  │ x402 Paywall │  │
│  │ Orchestrator     │  │ / Relayer    │  │ Indexer    │  │ Server       │  │
│  │                  │  │              │  │            │  │              │  │
│  │ start/pause/     │  │ build proof  │  │ watch      │  │ GET /queries │  │
│  │ resume/stop      │  │ submit tx    │  │ contract   │  │ HTTP 402     │  │
│  │ sessions         │  │ every 3-5s   │  │ events     │  │ verify pay   │  │
│  └────────┬─────────┘  └──────┬───────┘  └─────┬──────┘  └──────┬───────┘  │
│           │                   │                 │                │          │
│  ┌────────▼───────────────────▼─────────────────▼────────────────▼───────┐  │
│  │                        OnchainOS Data Layer                           │  │
│  │  Market API → prices, pools, TVL, volume                              │  │
│  │  Trade API  → DEX quotes, swap data, order books                      │  │
│  │  Wallet API → balances, token holdings, tx history                    │  │
│  │  X Layer RPC → direct contract reads (slot0, totalAssets, etc.)       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                                 │
│  │ Persistence      │  │ Object Storage   │                                 │
│  │ (SQLite/Postgres) │  │ (proof packages)  │                                 │
│  └─────────────────┘  └──────────────────┘                                 │
└──────────┬──────────────────────────────────────────────────────────────────┘
           │ contract writes / reads
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     X LAYER (Chain ID: 196, OP Stack)                       │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  AgentPayrollEscrow.sol                                                │ │
│  │  ─────────────────────                                                 │ │
│  │  Sessions: employer, agent, ratePerSecond, proofWindow, fundedBalance  │ │
│  │  Functions: createSession / topUp / submitProof / claim / pause /      │ │
│  │             resume / stop / refundUnused / enforceProofTimeout         │ │
│  │  Payment: USDC (bridged ERC-20)                                        │ │
│  │  Verification: proof hash + liveness check (not semantic correctness)  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  RPC: https://rpc.xlayer.tech                                               │
│  WS:  wss://xlayerws.okx.com                                               │
│  Flashblocks: https://rpc.xlayer.tech/flashblocks (200ms preconfirm)       │
│  Explorer: https://www.oklink.com/xlayer                                    │
│  Gas: OKB (near-zero)                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
Employer
  → approve USDC → createSession() on X Layer
  → fund escrow → startSession()

Contract emits SessionStarted
  → Backend Event Indexer sees event
  → Session Orchestrator starts AI agent

Agent work loop (every 3-5 seconds):
  → OnchainOS Market API → pool/token data
  → OnchainOS Trade API → DEX quotes/volume
  → X Layer RPC → direct contract reads
  → LLM analysis → structured output
  → Push to dashboard via SSE
  → Build proof package → hash(output + sources + blockNum)
  → submitProof() on X Layer → contract records heartbeat

If proof stops (> proofWindow seconds):
  → Anyone calls enforceProofTimeout()
  → Contract auto-pauses → salary accrual freezes
  → Dashboard shows PAUSED_NO_PROOF

Agent claims accumulated USDC:
  → claim() → USDC transferred from escrow

Public user queries findings:
  → GET /queries/analysis → HTTP 402
  → User signs EIP-3009 payment → retries with signature
  → Server verifies → returns analysis → HTTP 200
```

---

## 3. Smart Contracts

### 3.1 Design Principles

- **One contract** for MVP — `AgentPayrollEscrow.sol` handles sessions, proofs, and payments
- **Lazy accrual** — salary computed mathematically per-second, NOT one tx per second
- **Proof = liveness** — on-chain checks timing + submitter auth + hash presence; semantic verification stays off-chain
- **Anyone can trigger timeout** — no keeper dependency
- **Events over storage** — proof details in events, not heavy on-chain storage

### 3.2 AgentPayrollEscrow.sol

#### State Model

```solidity
enum Status { Created, Active, Paused, Stopped }

struct Session {
    address employer;
    address agent;
    address paymentToken;       // USDC on X Layer (bridged ERC-20)
    uint96  ratePerSecond;      // USDC smallest units / second
    uint40  proofWindow;        // max seconds between proofs before auto-pause
    uint40  minProofInterval;   // min seconds between proof submissions (anti-spam)
    uint40  startedAt;
    uint40  lastCheckpointAt;   // last time accrual was computed
    uint40  lastProofAt;        // last proof submission timestamp
    uint128 fundedBalance;      // total USDC deposited
    uint128 accruedUnclaimed;   // earned but not yet withdrawn
    uint128 totalClaimed;       // already withdrawn
    Status  status;
}

mapping(uint256 => Session) public sessions;
uint256 public nextSessionId;
```

#### Core Accounting Rule

On any state-changing call, run `_checkpoint(sessionId)`:

```
if status == Active:
    elapsed = block.timestamp - lastCheckpointAt
    // Cap by proof freshness
    effectiveEnd = min(block.timestamp, lastProofAt + proofWindow)
    validElapsed = max(0, effectiveEnd - lastCheckpointAt)
    newAccrual = validElapsed * ratePerSecond
    // Cap by remaining funds
    newAccrual = min(newAccrual, fundedBalance - accruedUnclaimed - totalClaimed)
    accruedUnclaimed += newAccrual
    lastCheckpointAt = block.timestamp
```

**Key insight**: Salary only accrues while `now <= lastProofAt + proofWindow`. Agent stops proving → accrual stops automatically.

#### Function Signatures

```solidity
interface IAgentPayrollEscrow {
    // === Session Lifecycle ===
    function createSession(
        address agent,
        address paymentToken,
        uint96  ratePerSecond,
        uint40  proofWindow,
        uint40  minProofInterval,
        uint128 depositAmount
    ) external returns (uint256 sessionId);

    function topUp(uint256 sessionId, uint128 amount) external;
    function startSession(uint256 sessionId) external;
    function pauseSession(uint256 sessionId) external;
    function resumeSession(uint256 sessionId) external;
    function stopSession(uint256 sessionId) external;

    // === Proof ===
    function submitProof(
        uint256 sessionId,
        bytes32 proofHash,        // keccak256(sessionId, seq, outputHash, dataHash, blockNum)
        string  calldata metadataURI  // pointer to full proof package (S3/IPFS)
    ) external;

    function enforceProofTimeout(uint256 sessionId) external;

    // === Payment ===
    function claim(uint256 sessionId) external returns (uint128 amount);
    function refundUnused(uint256 sessionId) external returns (uint128 amount);

    // === Views ===
    function accruedAvailable(uint256 sessionId) external view returns (uint128);
    function getSession(uint256 sessionId) external view returns (Session memory);
}
```

#### Access Control

| Function | Caller |
|---|---|
| `createSession`, `topUp`, `startSession`, `stopSession` | Employer only |
| `pauseSession` | Employer only |
| `resumeSession` | Employer only |
| `submitProof` | Agent only (or approved operator) |
| `enforceProofTimeout` | **Anyone** (permissionless — enables trustless timeout) |
| `claim` | Agent only |
| `refundUnused` | Employer only (after stop) |

#### Events

```solidity
event SessionCreated(uint256 indexed sessionId, address indexed employer, address indexed agent,
    address paymentToken, uint96 ratePerSecond, uint40 proofWindow, uint128 depositAmount);
event SessionStarted(uint256 indexed sessionId, uint40 startedAt);
event SessionPaused(uint256 indexed sessionId, bytes32 reason);
event SessionResumed(uint256 indexed sessionId);
event SessionStopped(uint256 indexed sessionId, uint128 agentEarned, uint128 employerRefund);
event SessionToppedUp(uint256 indexed sessionId, uint128 amount);
event ProofSubmitted(uint256 indexed sessionId, bytes32 indexed proofHash,
    string metadataURI, uint40 submittedAt);
event ProofTimeout(uint256 indexed sessionId, uint40 lastProofAt, uint40 timeoutAt);
event SalaryClaimed(uint256 indexed sessionId, address indexed agent, uint128 amount);
event FundsRefunded(uint256 indexed sessionId, address indexed employer, uint128 amount);
event DepositExhausted(uint256 indexed sessionId);
```

#### Implementation Notes

- Use `SafeERC20` for all USDC transfers
- Pack struct fields (`uint40`, `uint96`, `uint128`) for gas efficiency
- `claim()` calls `_checkpoint()` before transfer
- If deposit runs out during checkpoint → set `status = Paused`, emit `DepositExhausted`
- Store proof details in **events**, not storage (gas saving)

### 3.3 Contract Deployment

```bash
# Using Foundry
forge create src/AgentPayrollEscrow.sol:AgentPayrollEscrow \
  --rpc-url https://rpc.xlayer.tech \
  --private-key $DEPLOYER_KEY

# Verify on OKLink
forge verify-contract $CONTRACT_ADDRESS src/AgentPayrollEscrow.sol:AgentPayrollEscrow \
  --verifier-url "https://www.oklink.com/api/v5/explorer/contract/verify-source-code-plugin/XLAYER" \
  --etherscan-api-key $OKLINK_API_KEY
```

### 3.4 Demo Mode Settings

| Parameter | Demo | Production |
|---|---|---|
| `ratePerSecond` | 1000 (≈ $0.001/sec) | Configurable |
| `proofWindow` | 10 seconds | 60-120 seconds |
| `minProofInterval` | 3 seconds | 15-30 seconds |

---

## 4. Backend Services

### 4.1 Stack

- **Runtime**: Node.js 20+ / TypeScript
- **Framework**: Express or Hono
- **Chain**: viem for X Layer reads/writes
- **DB**: SQLite (hackathon simplicity) or Postgres
- **Real-time**: SSE for live agent output
- **OnchainOS**: REST API with HMAC-SHA256 auth

### 4.2 Module Architecture

#### A. Session Orchestrator

Manages the agent lifecycle in response to contract events.

```typescript
interface AnalysisSession {
  id: string;
  sessionId: bigint;           // on-chain session ID
  employerWallet: `0x${string}`;
  agentWallet: `0x${string}`;
  taskType: "pool-snapshot" | "yield-compare" | "token-flow";
  target: string;              // pool address, token address, etc.
  status: "idle" | "running" | "paused" | "completed" | "errored";
  startedAt: string;
  lastProofSeq: number;
}

// Core methods
startSession(sessionId: bigint, taskConfig: TaskConfig): Promise<string>
pauseSession(id: string, reason: string): Promise<void>
resumeSession(id: string): Promise<void>
stopSession(id: string): Promise<void>
```

#### B. Proof Worker / Relayer

Runs on a timer (every 3-5 seconds). Builds proof packages and submits on-chain.

```typescript
interface ProofPackage {
  sessionId: string;
  seq: number;
  intervalStart: string;       // ISO timestamp
  intervalEnd: string;
  chainAnchors: Array<{
    chain: string;
    blockNumber: number;
  }>;
  onchainOSCalls: Array<{
    api: "market" | "trade" | "wallet";
    endpoint: string;
    resultHash: string;
  }>;
  rpcCalls: Array<{
    method: string;
    target: string;
    resultHash: string;
  }>;
  computedMetrics: Record<string, string | number>;
  outputChunkHash: string;
  stepCount: number;
}
```

**Proof readiness rule**: Submit only if at least 2 of 4 are true since last proof:
1. At least 1 OnchainOS API call executed
2. At least 1 metric computed
3. At least 1 user-visible output chunk produced
4. At least 1 RPC read completed

#### C. Event Indexer

Watches X Layer for contract events via WebSocket:

```typescript
// wss://xlayerws.okx.com
const unwatch = publicClient.watchContractEvent({
  address: PAYROLL_CONTRACT,
  abi: agentPayrollEscrowAbi,
  onLogs: (logs) => {
    for (const log of logs) {
      switch (log.eventName) {
        case 'SessionStarted': orchestrator.startSession(log.args); break;
        case 'SessionPaused':  orchestrator.pauseSession(log.args); break;
        case 'ProofTimeout':   orchestrator.handleTimeout(log.args); break;
        case 'SalaryClaimed':  dashboard.notifyClaim(log.args); break;
      }
    }
  }
});
```

#### D. x402 Paywall Server

See [Section 7](#7-x402-integration).

### 4.3 OnchainOS API Integration

#### Authentication

```typescript
import crypto from 'crypto';

function signRequest(timestamp: string, method: string, path: string, body: string): string {
  const prehash = timestamp + method.toUpperCase() + path + body;
  return crypto.createHmac('sha256', OKX_SECRET_KEY).update(prehash).digest('base64');
}

// Headers for every request:
// OK-ACCESS-KEY: <api_key>
// OK-ACCESS-TIMESTAMP: <ISO 8601 UTC>
// OK-ACCESS-PASSPHRASE: <passphrase>
// OK-ACCESS-SIGN: <hmac_signature>
```

#### Key API Endpoints Used

| API | Endpoint | Purpose |
|---|---|---|
| Market | `/api/v5/market/tickers` | Real-time token prices |
| Market | `/api/v5/market/candles` | Historical price data |
| Trade | `/api/v5/dex/aggregator/quote` | DEX swap quotes |
| Trade | `/api/v5/dex/aggregator/swap` | Execute swaps (if needed) |
| Wallet | `/api/v5/wallet/asset/balances` | Token balances |
| Wallet | `/api/v5/wallet/asset/token-list` | Available tokens |

#### OnchainOS MCP Integration (Optional)

```typescript
// Agent can use OnchainOS MCP skills directly
// Reference: https://github.com/okx/onchainos-skills
import { OnchainOSClient } from './onchainos-client';

const os = new OnchainOSClient({ apiKey: OKX_API_KEY });
const poolData = await os.market.getPoolData({ chainId: 196, poolAddress: '0x...' });
const dexQuote = await os.trade.getQuote({ fromToken: 'USDC', toToken: 'OKB', amount: '100' });
```

### 4.4 Database Schema

```sql
-- Sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  onchain_session_id INTEGER NOT NULL,
  employer_wallet TEXT NOT NULL,
  agent_wallet TEXT NOT NULL,
  task_type TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  rate_per_second INTEGER NOT NULL,
  proof_window_sec INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agent work steps (timeline)
CREATE TABLE session_steps (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  seq INTEGER NOT NULL,
  step_type TEXT NOT NULL,  -- 'rpc' | 'metric' | 'commentary' | 'finding'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Proof submissions
CREATE TABLE proofs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  seq INTEGER NOT NULL,
  proof_hash TEXT NOT NULL,
  metadata_uri TEXT,
  tx_hash TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analysis reports
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  summary_json TEXT NOT NULL,
  scores_json TEXT,
  recommendation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- x402 query sales
CREATE TABLE query_sales (
  id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  payer_address TEXT NOT NULL,
  amount_usdc TEXT NOT NULL,
  receipt_ref TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. AI Agent Design

### 5.1 Architecture

The agent is a **templated analyst** with a thin LLM layer. It does NOT autonomously trade or move funds.

```
┌─────────────────────────────────────────────┐
│            DeFi Analyst Agent                │
│                                             │
│  1. Task Router                             │
│     → classify request → select template    │
│                                             │
│  2. OnchainOS Data Layer                    │
│     → Market API: prices, pools, volume     │
│     → Trade API: DEX quotes, liquidity      │
│     → Wallet API: balances, holdings        │
│                                             │
│  3. X Layer RPC (direct reads)              │
│     → ERC-20 balances                       │
│     → Pool state (slot0, liquidity)         │
│     → Vault state (totalAssets, sharePrice) │
│                                             │
│  4. Metrics Engine                          │
│     → Compute APY, utilization, IL risk     │
│     → Structured numeric outputs            │
│     → Code computes metrics, NOT LLM        │
│                                             │
│  5. LLM Summarizer (Claude/GPT)            │
│     → Turn metrics into human-readable      │
│     → Generate commentary + recommendations │
│                                             │
│  6. Proof Packager                          │
│     → hash(output + data + blockNum)        │
│     → Submit to contract every 3-5s         │
└─────────────────────────────────────────────┘
```

### 5.2 Model Strategy

| Role | Model | Why |
|---|---|---|
| Live reasoning + tool use | `gpt-4.1-mini` or `claude-3.5-haiku` | Low latency, low cost, frequent calls |
| Final synthesis | `gpt-4.1` or `claude-sonnet` | Better summarization for reports |

**Critical rule**: LLM never invents raw metrics. Code computes metrics from on-chain data. LLM only explains and summarizes.

### 5.3 Analysis Templates (MVP: 3 only)

#### A. Pool Health Snapshot
- **Input**: Pool address on X Layer or cross-chain
- **Data**: OnchainOS Market API + RPC reads (slot0, liquidity, fee, recent swap logs)
- **Output**: Price, volume proxy, liquidity depth, fee activity, risk flags, recommendation
- **Example**: "Analyze ETH/USDC 0.3% pool"

#### B. Yield Comparison
- **Input**: 2-3 token/pool addresses
- **Data**: OnchainOS Market API for prices + RPC for vault/pool state
- **Output**: Risk-adjusted yield ranking, deposit/withdraw trends, which option is stronger
- **Example**: "Compare USDC yield across 3 pools"

#### C. Token Flow Analysis
- **Input**: Token address or wallet address
- **Data**: OnchainOS Wallet API + Trade API + RPC event logs
- **Output**: Large transfer tracking, whale movement, volume analysis
- **Example**: "Analyze OKB flow on X Layer in last 24h"

### 5.4 Agent Step Output Format

```typescript
type AgentStep = {
  ts: string;                  // ISO timestamp
  kind: "rpc" | "api" | "metric" | "commentary" | "finding";
  title: string;               // Short description
  body: string;                // Full content
  metadata?: Record<string, unknown>;
};

// Examples:
// { kind: "api",  title: "Fetching pool data from OnchainOS Market API" }
// { kind: "rpc",  title: "Reading slot0() from X Layer pool" }
// { kind: "metric", title: "Pool TVL: $2.4M, 24h Volume: $180K" }
// { kind: "finding", title: "Volume/TVL ratio 7.5% suggests healthy activity" }
```

### 5.5 Final Report Format

```json
{
  "taskType": "pool-snapshot",
  "target": "0x...",
  "chain": "xlayer",
  "anchorBlock": 12345678,
  "summary": "This pool shows healthy trading activity with balanced liquidity.",
  "scores": {
    "liquidityHealth": 78,
    "volumeActivity": 65,
    "riskLevel": 32,
    "yieldPotential": 71
  },
  "metrics": {
    "tvl": "2400000",
    "volume24h": "180000",
    "feeRate": "0.003",
    "currentPrice": "3124.22"
  },
  "recommendation": "Liquidity provision at current range is favorable given the volume/TVL ratio.",
  "evidenceRefs": [
    "xlayer:pool.slot0@12345678",
    "onchainos:market.tickers@2026-03-24T10:00:00Z"
  ]
}
```

### 5.6 Proof Definition

For MVP, proof = **verifiable liveness + evidence anchoring**.

A valid proof interval must include:
- At least 1 real data fetch (OnchainOS API or RPC)
- At least 1 computed metric
- At least 1 user-visible output chunk
- Hashes of those artifacts submitted on-chain

What it proves: **the agent produced measurable work artifacts during this interval.**  
What it does NOT prove: analytical correctness (that stays off-chain for hackathon).

---

## 6. Frontend Architecture

### 6.1 Pages

```
/                       Landing page — product explainer
/employer               Employer dashboard — create + manage streams
/session/[id]           Live work + salary stream page (THE DEMO PAGE)
/reports/[id]           Final report page — post-analysis view
/query                  Public paid-query page — x402 paywall
```

### 6.2 Real-Time Strategy

| Source | Transport | Data |
|---|---|---|
| Agent steps + proof confirmations | **SSE** (one-way, simple) | AgentStep[], proof events |
| On-chain state (accrued, status) | **Polling** (viem, every 2-3s) | accruedAvailable, session status |
| Salary ticker | **Optimistic local** | `display += ratePerSecond` every 1s, reset on poll |

**Why SSE over WebSocket**: Simpler, one-way is sufficient for logs, less setup for 10-day sprint.

**Optional upgrade**: Use X Layer WebSocket (`wss://xlayerws.okx.com`) to subscribe to `newHeads` for block-level freshness.

### 6.3 Key Components

```
/components/
├── wallet/
│   └── ConnectWalletButton.tsx
├── stream/
│   ├── StreamControlPanel.tsx      — create/fund/start/pause/resume/stop
│   ├── SalaryTicker.tsx            — animated USDC counter (THE visual hook)
│   ├── ProofHeartbeatTimeline.tsx  — proof events on a timeline
│   └── StreamStatusBadge.tsx       — RUNNING / PAUSED_NO_PROOF / STOPPED
├── session/
│   ├── AgentWorkTimeline.tsx       — live step-by-step work output
│   ├── CurrentTaskCard.tsx         — what the agent is doing now
│   └── MetricsGrid.tsx             — computed metrics cards
├── reports/
│   ├── ReportSummaryCard.tsx       — executive summary
│   ├── ScoreCards.tsx              — health/risk/yield scores
│   └── EvidenceTable.tsx           — proof references
└── query/
    ├── X402PaywallCard.tsx         — price display + pay button
    └── PaidResponseViewer.tsx      — unlocked analysis view
```

### 6.4 Demo Visual Moments

1. **Salary counter ticking** — USDC incrementing every second (visual hook)
2. **Proof heartbeat pulse** — green flash every 3-5s: "Proof Anchored on X Layer ✓"
3. **Agent work appearing** — live timeline of data fetches → metrics → findings
4. **THE KEY MOMENT**: Kill agent → proof stops → counter FREEZES → "No proof = no pay"
5. **Recovery**: Resume agent → proof resumes → counter restarts
6. **x402 query**: Public user pays $0.005 → response unlocks instantly

---

## 7. x402 Integration

### 7.1 Role

x402 powers **Use Case 2: Pay-per-query**. It does NOT power the streaming salary (that's the on-chain escrow).

### 7.2 Flow

```
User                            x402 Server                         Agent DB
 │                                   │                                  │
 │  GET /queries/pool-analysis       │                                  │
 │ ────────────────────────────────► │                                  │
 │                                   │                                  │
 │  HTTP 402                         │                                  │
 │  PAYMENT-REQUIRED:                │                                  │
 │  { price: "0.005",               │                                  │
 │    asset: "USDC",                │                                  │
 │    network: "xlayer" }           │                                  │
 │ ◄──────────────────────────────── │                                  │
 │                                   │                                  │
 │  Retry + PAYMENT-SIGNATURE        │                                  │
 │  (EIP-3009 signed authorization)  │                                  │
 │ ────────────────────────────────► │  fetch cached analysis           │
 │                                   │ ───────────────────────────────► │
 │  HTTP 200 + analysis result       │                                  │
 │ ◄──────────────────────────────── │ ◄─────────────────────────────── │
```

### 7.3 Endpoints

| Route | Price | Description |
|---|---|---|
| `GET /queries/report/:id/summary` | $0.001 | Brief summary of analysis |
| `POST /queries/followup` | $0.003 | Ask a follow-up question |
| `GET /queries/report/:id/evidence` | $0.005 | Full evidence package |
| `POST /queries/pool-risk` | $0.005 | Custom pool risk analysis |

### 7.4 Implementation

Use [x402-gateway-template](https://github.com/azep-ninja/x402-gateway-template) for fastest setup, or `@x402/express` middleware.

```typescript
// Abstract payment verification for swappability
interface PaidAccessService {
  verifyPayment(req: Request): Promise<PaymentResult>;
  priceForRoute(route: string): PriceQuote;
}

// Implementations:
// - X402ExactEVM (primary)
// - MockApiKey (local dev)
```

---

## 8. On-Chain Transaction Strategy

### 8.1 Target: 50+ transactions

Do NOT make each second = one payment tx. Proofs create the chain activity.

```
┌──────────────────────────┬─────────┬─────────────────────────────────┐
│ Transaction Type         │ Count   │ Detail                          │
├──────────────────────────┼─────────┼─────────────────────────────────┤
│ USDC approve             │ 1-2     │ Approve contract to spend USDC  │
│ createSession            │ 2-3     │ Multiple demo sessions          │
│ topUp                    │ 1-2     │ Show funding mechanism          │
│ startSession             │ 2-3     │ Activate streams                │
│ submitProof              │ 30-40   │ Every 3-5s for 2-3 minutes      │
│ pause / resume           │ 2-4     │ Demo accountability moment      │
│ enforceProofTimeout      │ 1-2     │ Show permissionless timeout     │
│ claim                    │ 3-5     │ Agent withdraws earned USDC     │
│ stopSession              │ 1-2     │ Clean session termination       │
│ x402 settlements         │ 5-10    │ Spot query payments             │
├──────────────────────────┼─────────┼─────────────────────────────────┤
│ TOTAL                    │ 48-73   │ Comfortably exceeds 50 ✓        │
└──────────────────────────┴─────────┴─────────────────────────────────┘
```

### 8.2 Margin Explanation

> **Why this can only work on X Layer:**
>
> - **Ethereum mainnet**: ERC-20 transfer ~$0.50-2.00. A single proof tx costs more than 500 seconds of agent salary.
> - **Standard L2**: $0.01-0.05/tx. Still exceeds per-proof value. Fee volatility unpredictable.
> - **X Layer**: Gas near-zero (OKB). Proof submission < $0.001. Every second of agent work is profitable. Flashblocks give 200ms preconfirmation for real-time UX.

---

## 9. Project File Structure

```
riverting/
├── README.md
├── docs/
│   └── ARCHITECTURE.md          ← this file
│
├── contracts/
│   ├── foundry.toml
│   ├── src/
│   │   ├── AgentPayrollEscrow.sol
│   │   └── interfaces/
│   │       └── IAgentPayrollEscrow.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── test/
│       └── AgentPayrollEscrow.t.sol
│
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.ts
│       ├── config.ts
│       ├── api/
│       │   ├── streams.routes.ts
│       │   ├── sessions.routes.ts
│       │   └── queries.routes.ts
│       ├── services/
│       │   ├── orchestrator/
│       │   │   ├── sessionManager.ts
│       │   │   └── streamEventHandler.ts
│       │   ├── proof/
│       │   │   ├── proofBuilder.ts
│       │   │   ├── proofRelayer.ts
│       │   │   └── timeoutWatcher.ts
│       │   ├── onchain/
│       │   │   ├── xlayerClient.ts
│       │   │   ├── contractClient.ts
│       │   │   └── eventWatcher.ts
│       │   ├── data/
│       │   │   ├── onchainosClient.ts
│       │   │   ├── marketAdapter.ts
│       │   │   ├── tradeAdapter.ts
│       │   │   └── rpcAdapter.ts
│       │   ├── payments/
│       │   │   ├── x402Server.ts
│       │   │   └── pricing.ts
│       │   └── realtime/
│       │       └── sseHub.ts
│       ├── db/
│       │   ├── schema.sql
│       │   └── client.ts
│       └── types/
│           └── index.ts
│
├── agent/
│   ├── package.json
│   └── src/
│       ├── index.ts
│       ├── prompts/
│       │   ├── system.ts
│       │   ├── poolSnapshot.ts
│       │   ├── yieldCompare.ts
│       │   └── tokenFlow.ts
│       ├── runner/
│       │   ├── analysisSession.ts
│       │   ├── stepEmitter.ts
│       │   └── reportSynthesizer.ts
│       ├── tools/
│       │   ├── readPoolState.ts
│       │   ├── readVaultState.ts
│       │   ├── readTokenFlow.ts
│       │   └── computeMetrics.ts
│       ├── proof/
│       │   ├── buildProofPackage.ts
│       │   └── hashProofPackage.ts
│       └── types/
│           └── index.ts
│
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── app/
│   │   ├── page.tsx
│   │   ├── employer/
│   │   │   └── page.tsx
│   │   ├── session/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── reports/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── query/
│   │       └── page.tsx
│   ├── components/
│   │   ├── wallet/
│   │   ├── stream/
│   │   ├── session/
│   │   ├── reports/
│   │   └── query/
│   ├── lib/
│   │   ├── api.ts
│   │   ├── xlayerClient.ts
│   │   ├── sse.ts
│   │   └── format.ts
│   └── types/
│       └── index.ts
│
└── shared/
    ├── abis/
    │   └── AgentPayrollEscrow.ts
    ├── config/
    │   ├── chains.ts              — X Layer chain config (196)
    │   ├── addresses.ts           — contract + USDC addresses
    │   └── pricing.ts             — x402 pricing config
    └── types/
        └── common.ts
```

---

## 10. 10-Day Build Plan

### Work Split

- **Dev A**: Contracts + Backend + X Layer integration + x402
- **Dev B**: Frontend + Agent + Demo UX

```
┌───────────┬──────────────────────────────┬──────────────────────────────┐
│ Day       │ Dev A (Contracts + Backend)  │ Dev B (Frontend + Agent)     │
├───────────┼──────────────────────────────┼──────────────────────────────┤
│ Day 1     │ Monorepo + Foundry setup     │ Next.js + wallet connect     │
│           │ AgentPayrollEscrow skeleton  │ Employer page shell          │
│           │ Deploy to X Layer testnet    │ Session page shell           │
│           │ viem X Layer client          │ Design system tokens         │
│           │                              │                              │
│ MILESTONE │ Contract compiles + deploys. Wallet connects to X Layer.    │
├───────────┼──────────────────────────────┼──────────────────────────────┤
│ Day 2     │ createSession, startSession  │ Employer form → contract     │
│           │ claim, accruedAvailable      │ SalaryTicker component       │
│           │ Unit tests for accrual math  │ Stream state cards           │
│           │ Backend: POST /streams       │ Success/error TX UI          │
│           │                              │                              │
│ MILESTONE │ Employer funds + starts stream. Agent can claim USDC. ✓     │
├───────────┼──────────────────────────────┼──────────────────────────────┤
│ Day 3     │ submitProof + proofWindow    │ Mock agent runtime           │
│           │ enforceProofTimeout          │ Live timeline UI             │
│           │ Backend: proof relayer       │ Proof heartbeat component    │
│           │ DB schema + session store    │ StreamStatusBadge            │
│           │                              │                              │
│ MILESTONE │ Proof tx lands every 5s. Timeout auto-pauses stream. ✓     │
├───────────┼──────────────────────────────┼──────────────────────────────┤
│ Day 4     │ Event watcher (WebSocket)    │ SSE client hookup            │
│           │ SSE endpoint for events      │ UI reacts to proof events    │
│           │ pause/resume/stop logic      │ Paused state visuals         │
│           │ Connect proof → heartbeat    │ "No proof" alert state       │
│           │                              │                              │
│ MILESTONE │ Stream pauses visibly when proof stops. Counter freezes. ✓  │
├───────────┼──────────────────────────────┼──────────────────────────────┤
│ Day 5     │ OnchainOS API integration    │ Real agent → OnchainOS calls │
│           │ Market + Trade adapters      │ Pool snapshot template       │
│           │ Proof package builder        │ MetricsGrid component        │
│           │ Evidence storage upload      │ Findings cards               │
│           │                              │                              │
│ MILESTONE │ Agent analyzes real X Layer pool data. Proofs contain real  │
│           │ evidence hashes. ✓                                          │
├───────────┼──────────────────────────────┼──────────────────────────────┤
│ Day 6     │ Second data adapter          │ Yield compare template       │
│           │ Report persistence           │ Token flow template          │
│           │ Report API endpoint          │ Report page + scorecards     │
│           │                              │                              │
│ MILESTONE │ 2-3 analysis types work. Final reports generated. ✓        │
├───────────┼──────────────────────────────┼──────────────────────────────┤
│ Day 7     │ x402 middleware setup        │ Public query page            │
│           │ Pricing config               │ Payment required state       │
│           │ Receipt logging              │ Paid response viewer         │
│           │ Paid endpoints (2-3)         │ Premium CTA on reports       │
│           │                              │                              │
│ MILESTONE │ x402 pay-per-query works end-to-end. ✓                     │
├───────────┼──────────────────────────────┼──────────────────────────────┤
│ Day 8     │ ──────────── INTEGRATION DAY ────────────                  │
│           │ End-to-end testing           │ Full flow testing            │
│           │ Edge case fixes              │ All pages connected          │
│           │ X Layer mainnet deploy       │ Mainnet wallet config        │
│           │                              │                              │
│ MILESTONE │ Full happy path on X Layer mainnet. 50+ txs verified. ✓    │
├───────────┼──────────────────────────────┼──────────────────────────────┤
│ Day 9     │ Contract hardening           │ Animations + polish          │
│           │ Demo mode config             │ Explorer links + tx badges   │
│           │ Seed demo data               │ Pause/resume theater moment  │
│           │ Fallback TX recordings       │ Mobile/tablet sanity pass    │
│           │                              │                              │
│ MILESTONE │ Demo flow stable. Visual polish complete. ✓                │
├───────────┼──────────────────────────────┼──────────────────────────────┤
│ Day 10    │ Env freeze + final deploy    │ Rehearse 3-min demo          │
│           │ Backup demo data capture     │ Record fallback video        │
│           │ Pitch deck review            │ Submission prep              │
│           │                              │                              │
│ MILESTONE │ Production demo ready. Backup recording ready. Ship. ✓     │
└───────────┴──────────────────────────────┴──────────────────────────────┘
```

### Daily Acceptance Checklist

- **Day 2**: ☐ Fund stream ☐ Start stream ☐ Accrual increases ☐ Withdraw works
- **Day 4**: ☐ Proof visible on-chain ☐ Missing proof pauses ☐ Dashboard shows pause
- **Day 6**: ☐ Real DeFi analysis works ☐ Outputs readable ☐ Proof hashes match work
- **Day 8**: ☐ x402 paid query works ☐ Mainnet deployed ☐ 50+ txs verified
- **Day 10**: ☐ Full live run ☐ Fallback run ☐ Pitch rehearsed

### Cut Priority (if behind)

1. ~~Third analysis template~~ — cut first
2. ~~Advanced charts/sparklines~~ 
3. ~~Auto-claim interval~~
4. ~~Mobile layout~~
5. x402 endpoint — cut last
6. Proof-pause demo moment — **NEVER cut**
7. Live salary ticker — **NEVER cut**

---

## 11. Risk Mitigation

```
┌────────────────────────────────┬───────────────────────────────────────────┐
│ Risk                           │ Mitigation                                │
├────────────────────────────────┼───────────────────────────────────────────┤
│ X Layer DeFi ecosystem thin    │ Use OnchainOS Market/Trade APIs — they    │
│                                │ aggregate across OKX ecosystem, not just  │
│                                │ X Layer native. Can analyze cross-chain.  │
│                                │ X Layer is the SETTLEMENT chain.          │
├────────────────────────────────┼───────────────────────────────────────────┤
│ OnchainOS API immature         │ Fallback: direct X Layer RPC reads +      │
│                                │ public APIs (CoinGecko, DefiLlama).       │
│                                │ Agent adapters are swappable.             │
├────────────────────────────────┼───────────────────────────────────────────┤
│ x402 integration complex       │ Use x402-gateway-template (Docker).       │
│                                │ Worst case: x402 is nice-to-have,         │
│                                │ streaming salary is core demo.            │
├────────────────────────────────┼───────────────────────────────────────────┤
│ USDC liquidity on X Layer low  │ Demo uses small amounts ($1-5).           │
│                                │ Self-bridge USDC via X Layer Bridge.      │
├────────────────────────────────┼───────────────────────────────────────────┤
│ Proof feels fake to judges     │ Don't oversell as "AI correctness proof." │
│                                │ Frame as liveness + evidence anchoring.   │
│                                │ Show real data in dashboard alongside     │
│                                │ proof hashes.                             │
├────────────────────────────────┼───────────────────────────────────────────┤
│ Agent output quality           │ Code computes metrics (deterministic).    │
│                                │ LLM only explains. Pre-test demo prompts. │
│                                │ Fallback: deterministic metrics-only mode.│
├────────────────────────────────┼───────────────────────────────────────────┤
│ Real-time UI flaky             │ SSE + polling (simple, reliable).         │
│                                │ Optimistic local ticker between polls.    │
│                                │ Flashblocks 200ms for near-instant conf.  │
├────────────────────────────────┼───────────────────────────────────────────┤
│ Gas costs add up               │ X Layer gas near-zero (OKB).              │
│                                │ Demo 60+ txs total gas < $0.01.           │
├────────────────────────────────┼───────────────────────────────────────────┤
│ Smart contract bug in demo     │ Keep contract tiny (~200 lines).          │
│                                │ Test accrual math extensively.            │
│                                │ Demo happy path only if edge cases break. │
└────────────────────────────────┴───────────────────────────────────────────┘
```

---

## 12. Demo Choreography

### 3-Minute Demo Script

**0:00 – 0:30 | Problem**
> "AI agents can now do real financial analysis. But how do you pay them? Upfront subscriptions waste money on idle time. Per-project payments require trust that the agent will deliver. There's no pay-as-you-go model for AI labor."

**0:30 – 1:30 | Live Demo**
1. Employer connects wallet, deposits 5 USDC
2. Starts stream at $0.001/sec for Pool Health Snapshot
3. Agent begins analyzing — live timeline shows data fetches → metrics → findings
4. Salary counter ticks up: $0.001… $0.002… $0.003…
5. Every 3 seconds: "✓ Proof Anchored on X Layer" appears on timeline
6. OKLink explorer shows tx hashes in real-time

**1:30 – 2:00 | The Moment**
7. **Kill the agent process**
8. Proof stops arriving
9. After 10 seconds: **counter FREEZES** — "⚠️ PAUSED: No Proof Detected"
10. "You only pay for work that actually happens."
11. Resume agent → proof resumes → counter restarts

**2:00 – 2:30 | x402**
12. Switch to public query page
13. "Anyone can ask this agent a question for $0.005"
14. Submit query → HTTP 402 → pay → analysis unlocks
15. "Two monetization modes: retained salary + spot queries."

**2:30 – 3:00 | Numbers + Vision**
16. "This demo ran 60+ on-chain transactions. Total gas: $0.008."
17. "On Ethereum mainnet, the gas alone would cost more than the agent's entire salary."
18. "Every AI agent that does work deserves to get paid for exactly what it does — not more, not less. That's Riverting."

### 60-Second Pitch

> "AI agents 開始能做真實的鏈上工作了。但誰來為它們的時間付費？"
>
> "Riverting 讓 AI agent 按秒領薪。Demo 裡的 DeFi 分析師用 OKX OnchainOS 實時分析鏈上數據，每 3 秒提交一次 proof-of-work。employer 看到工作和薪資同步流動。Agent 停工？Proof 斷了，錢立刻停。"
>
> "同一個 agent 還通過 x402 賣單次分析 — $0.005 一次查詢，HTTP 402 自動收費。"
>
> "60+ 筆鏈上交易，total gas < $0.01。這種每秒結算 + 每次驗證的模式，只有在 X Layer 的零 gas 環境下才成立。"

---

## Appendix A: Key External References

| Resource | URL |
|---|---|
| X Layer Docs | https://web3.okx.com/zh-hans/xlayer/docs/developer/build-on-xlayer/about-xlayer |
| OnchainOS Dev Docs | https://web3.okx.com/onchainos/dev-docs/wallet/onchain-gateway-api-reference |
| OnchainOS Skills (GitHub) | https://github.com/okx/onchainos-skills |
| x402 Protocol | https://www.x402.org/ |
| x402 Docs | https://docs.x402.org/introduction |
| x402 Go Implementation | https://github.com/mark3labs/x402-go |
| x402 Gateway Template | https://github.com/azep-ninja/x402-gateway-template |
| X Layer RPC | https://rpc.xlayer.tech |
| X Layer WebSocket | wss://xlayerws.okx.com |
| X Layer Flashblocks RPC | https://rpc.xlayer.tech/flashblocks |
| X Layer Explorer (OKLink) | https://www.oklink.com/xlayer |
| Superfluid (reference) | https://docs.superfluid.zone/ |
| Sablier (reference) | https://app.sablier.com/ |

## Appendix B: Environment Variables

```env
# X Layer
XLAYER_RPC_URL=https://rpc.xlayer.tech
XLAYER_WS_URL=wss://xlayerws.okx.com
XLAYER_CHAIN_ID=196

# Contracts (after deployment)
PAYROLL_CONTRACT_ADDRESS=
USDC_ADDRESS=              # Bridged USDC on X Layer

# Wallets
DEPLOYER_PRIVATE_KEY=
AGENT_PRIVATE_KEY=

# OnchainOS
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_PASSPHRASE=

# AI
OPENAI_API_KEY=            # or ANTHROPIC_API_KEY
AI_MODEL_LIVE=gpt-4.1-mini
AI_MODEL_SYNTHESIS=gpt-4.1

# x402
X402_PAYMENT_ADDRESS=      # Address to receive x402 payments
X402_NETWORK=xlayer

# Database
DATABASE_URL=file:./dev.db  # SQLite for hackathon
```
