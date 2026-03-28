#!/bin/bash
# ============================================================
# Riverting Escrow — X Layer Mainnet Contract Test
# ============================================================
# 
# 使用方式：
#   export PRIVATE_KEY="0x你的私鑰"
#   bash scripts/test-mainnet-contract.sh
#
# 需要：
#   - cast (Foundry CLI)
#   - 錢包有 OKB (gas) + USDC (測試 session)
#
# 測試完會建一個 test agent + test session，用很少的 USDC
# ============================================================

set -e

ESCROW="0x1fE2371012FB887AdC5f7280aE69a6FCC522dde7"
USDC="0x74b7F16337b8972027F6196A17a631aC6dE26d22"
RPC="https://rpc.xlayer.tech"
CHAIN_ID=196

if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ 請先設定 PRIVATE_KEY:"
  echo "   export PRIVATE_KEY=\"0x你的私鑰\""
  exit 1
fi

WALLET=$(cast wallet address "$PRIVATE_KEY")
echo "🔑 Wallet: $WALLET"
echo "📍 Escrow: $ESCROW"
echo "💰 USDC:   $USDC"
echo "🌐 RPC:    $RPC"
echo ""

# ─── Test 0: Check balances ─────────────────────────────────
echo "═══════════════════════════════════════════"
echo "  TEST 0: Check balances"
echo "═══════════════════════════════════════════"

OKB_BALANCE=$(cast balance "$WALLET" --rpc-url "$RPC" --ether)
echo "  OKB balance: $OKB_BALANCE"

USDC_BALANCE=$(cast call "$USDC" "balanceOf(address)(uint256)" "$WALLET" --rpc-url "$RPC")
echo "  USDC balance: $USDC_BALANCE (raw, 6 decimals)"
echo ""

# ─── Test 1: Register Agent ─────────────────────────────────
echo "═══════════════════════════════════════════"
echo "  TEST 1: registerAgent(100, \"test-agent\")"
echo "═══════════════════════════════════════════"

TX1=$(cast send "$ESCROW" \
  "registerAgent(uint96,string)" 100 "test-mainnet-agent" \
  --rpc-url "$RPC" --chain "$CHAIN_ID" \
  --private-key "$PRIVATE_KEY" \
  --json | python3 -c "import sys,json; print(json.load(sys.stdin)['transactionHash'])")

echo "  ✅ TX: $TX1"

NEXT_ID=$(cast call "$ESCROW" "nextAgentId()(uint256)" --rpc-url "$RPC")
AGENT_ID=$((NEXT_ID - 1))
echo "  Agent ID: $AGENT_ID"

AGENT_DATA=$(cast call "$ESCROW" "getAgent(uint256)" "$AGENT_ID" --rpc-url "$RPC")
echo "  Agent data: $AGENT_DATA"
echo ""

# ─── Test 2: Approve USDC ───────────────────────────────────
echo "═══════════════════════════════════════════"
echo "  TEST 2: USDC approve (1 USDC = 1000000)"
echo "═══════════════════════════════════════════"

TX2=$(cast send "$USDC" \
  "approve(address,uint256)" "$ESCROW" 1000000 \
  --rpc-url "$RPC" --chain "$CHAIN_ID" \
  --private-key "$PRIVATE_KEY" \
  --json | python3 -c "import sys,json; print(json.load(sys.stdin)['transactionHash'])")

echo "  ✅ TX: $TX2"

ALLOWANCE=$(cast call "$USDC" "allowance(address,address)(uint256)" "$WALLET" "$ESCROW" --rpc-url "$RPC")
echo "  Allowance: $ALLOWANCE"
echo ""

# ─── Test 3: Create Session ─────────────────────────────────
echo "═══════════════════════════════════════════"
echo "  TEST 3: createSession(agentId=$AGENT_ID, deposit=1000)"
echo "  (1000 = 0.001 USDC — 微量測試)"
echo "═══════════════════════════════════════════"

TX3=$(cast send "$ESCROW" \
  "createSession(uint256,uint128)" "$AGENT_ID" 1000 \
  --rpc-url "$RPC" --chain "$CHAIN_ID" \
  --private-key "$PRIVATE_KEY" \
  --json | python3 -c "import sys,json; print(json.load(sys.stdin)['transactionHash'])")

echo "  ✅ TX: $TX3"

NEXT_SID=$(cast call "$ESCROW" "nextSessionId()(uint256)" --rpc-url "$RPC")
SESSION_ID=$((NEXT_SID - 1))
echo "  Session ID: $SESSION_ID"

SESSION_DATA=$(cast call "$ESCROW" "getSession(uint256)" "$SESSION_ID" --rpc-url "$RPC")
echo "  Session data: $SESSION_DATA"
echo ""

# ─── Test 4: Submit Proof ────────────────────────────────────
echo "═══════════════════════════════════════════"
echo "  TEST 4: submitProof (platformOperator only)"
echo "═══════════════════════════════════════════"

PROOF_HASH="0x$(openssl rand -hex 32)"

TX4=$(cast send "$ESCROW" \
  "submitProof(uint256,bytes32,string)" "$SESSION_ID" "$PROOF_HASH" "ipfs://test" \
  --rpc-url "$RPC" --chain "$CHAIN_ID" \
  --private-key "$PRIVATE_KEY" \
  --json | python3 -c "import sys,json; print(json.load(sys.stdin)['transactionHash'])")

echo "  ✅ TX: $TX4"
echo "  Proof hash: $PROOF_HASH"
echo ""

# ─── Test 5: Stop Session ───────────────────────────────────
echo "═══════════════════════════════════════════"
echo "  TEST 5: stopSession($SESSION_ID)"
echo "═══════════════════════════════════════════"

TX5=$(cast send "$ESCROW" \
  "stopSession(uint256)" "$SESSION_ID" \
  --rpc-url "$RPC" --chain "$CHAIN_ID" \
  --private-key "$PRIVATE_KEY" \
  --json | python3 -c "import sys,json; print(json.load(sys.stdin)['transactionHash'])")

echo "  ✅ TX: $TX5"

SESSION_FINAL=$(cast call "$ESCROW" "getSession(uint256)" "$SESSION_ID" --rpc-url "$RPC")
echo "  Final session data: $SESSION_FINAL"
echo ""

# ─── Summary ─────────────────────────────────────────────────
echo "═══════════════════════════════════════════"
echo "  ✅ ALL TESTS PASSED"
echo "═══════════════════════════════════════════"
echo ""
echo "  Escrow:          $ESCROW"
echo "  Test Agent ID:   $AGENT_ID"
echo "  Test Session ID: $SESSION_ID"
echo ""
echo "  TX1 (register):  $TX1"
echo "  TX2 (approve):   $TX2"
echo "  TX3 (session):   $TX3"
echo "  TX4 (proof):     $TX4"
echo "  TX5 (stop):      $TX5"
echo ""
echo "  Explorer: https://www.oklink.com/xlayer/address/$ESCROW"
echo ""
echo "  合約功能全部正常！可以切 mainnet 了。"
