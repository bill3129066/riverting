'use client'
import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useSignMessage } from 'wagmi'
import { parseUnits, formatUnits, maxUint256 } from 'viem'
import { fetchBalance, depositFunds } from '@/lib/skills-api'
import { signAction } from '@/lib/sign-action'

const USDC_ADDRESS = '0x74b7F16337b8972027F6196A17a631aC6dE26d22' as const
const ESCROW_ADDRESS = '0x93e2794E042b6326356768B7CfDeFc871008239e' as const

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const APPROVE_PRESETS = [10, 50, 100, 500]
const DEPOSIT_PRESETS = [5, 10, 20, 50]

export default function SettingsPage() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [approveAmount, setApproveAmount] = useState('100')
  const [depositAmount, setDepositAmount] = useState('10')
  const [displayName, setDisplayName] = useState('')
  const [saved, setSaved] = useState(false)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  const [depositing, setDepositing] = useState(false)
  const [depositSuccess, setDepositSuccess] = useState(false)
  const [platformBalance, setPlatformBalance] = useState<{ balance: number; total_deposited: number; total_spent: number } | null>(null)

  useEffect(() => {
    setDisplayName(localStorage.getItem('riverting_display_name') || '')
  }, [])

  useEffect(() => {
    if (!address) return
    fetchBalance(address).then(setPlatformBalance).catch(() => {})
  }, [address])

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, ESCROW_ADDRESS] : undefined,
    query: { enabled: !!address },
  })

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (txSuccess && approving) {
      setApproving(false)
      setApproved(true)
      refetchAllowance()
      refetchBalance()
      setTimeout(() => setApproved(false), 3000)
    }
  }, [txSuccess])

  function handleApprove() {
    if (!address) return
    setApproving(true)
    const amount = approveAmount === 'max'
      ? maxUint256
      : parseUnits(approveAmount, 6)
    writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ESCROW_ADDRESS, amount],
    })
  }

  async function handleDeposit() {
    if (!address) return
    setDepositing(true)
    try {
      const amount = Math.round(Number(depositAmount) * 1_000_000)
      const auth = await signAction(signMessageAsync, address, 'deposit')
      const result = await depositFunds(amount, auth)
      setPlatformBalance(result)
      setDepositSuccess(true)
      setTimeout(() => setDepositSuccess(false), 3000)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDepositing(false)
    }
  }

  function saveProfile() {
    localStorage.setItem('riverting_display_name', displayName)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const usdcBalance = balance ? Number(formatUnits(balance as bigint, 6)) : 0
  const authorizedAmount = allowance ? Number(formatUnits(allowance as bigint, 6)) : 0
  const isUnlimited = allowance && (allowance as bigint) === maxUint256
  const isApproved = isUnlimited || authorizedAmount > 0
  const platformAvailable = platformBalance ? platformBalance.balance / 1_000_000 : 0
  const isLoading = approving || isPending

  const step1Done = isApproved
  const step2Done = platformBalance !== null && platformBalance.balance > 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-[#666] text-sm mt-1">Account & balance management</p>
        </div>

        {/* 3-Step Flow Guide */}
        {isConnected && (
          <section className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
            <p className="text-xs text-[#555] uppercase tracking-wide mb-4">Funding flow</p>
            <div className="flex items-center gap-2">
              {/* Step 1 */}
              <div className={`flex items-center gap-2.5 flex-1 ${step1Done ? 'opacity-100' : 'opacity-70'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  step1Done ? 'bg-[#00d4aa] text-black' : 'bg-[#222] text-[#666]'
                }`}>
                  {step1Done ? '✓' : '1'}
                </div>
                <div>
                  <p className="text-sm font-medium">Approve</p>
                  <p className="text-xs text-[#555]">Grant contract permission</p>
                </div>
              </div>

              <div className={`h-px flex-[0.3] ${step1Done ? 'bg-[#00d4aa]/40' : 'bg-[#222]'}`} />

              {/* Step 2 */}
              <div className={`flex items-center gap-2.5 flex-1 ${step2Done ? 'opacity-100' : step1Done ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  step2Done ? 'bg-[#00d4aa] text-black' : 'bg-[#222] text-[#666]'
                }`}>
                  {step2Done ? '✓' : '2'}
                </div>
                <div>
                  <p className="text-sm font-medium">Deposit</p>
                  <p className="text-xs text-[#555]">Fund your platform balance</p>
                </div>
              </div>

              <div className={`h-px flex-[0.3] ${step2Done ? 'bg-[#00d4aa]/40' : 'bg-[#222]'}`} />

              {/* Step 3 */}
              <div className={`flex items-center gap-2.5 flex-1 ${step2Done ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  step2Done ? 'bg-[#00d4aa] text-black' : 'bg-[#222] text-[#666]'
                }`}>
                  {step2Done ? '✓' : '3'}
                </div>
                <div>
                  <p className="text-sm font-medium">Run Skills</p>
                  <p className="text-xs text-[#555]">Charged from platform balance</p>
                </div>
              </div>
            </div>

            {!step1Done && (
              <p className="text-xs text-yellow-500/80 mt-4 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-3 py-2">
                Complete step 1 (Approve) before depositing funds
              </p>
            )}
            {step1Done && !step2Done && (
              <p className="text-xs text-[#00d4aa]/80 mt-4 bg-[#00d4aa]/5 border border-[#00d4aa]/10 rounded-lg px-3 py-2">
                Approved. Complete step 2 (Deposit) to fund your platform balance.
              </p>
            )}
            {step1Done && step2Done && (
              <p className="text-xs text-[#00d4aa]/80 mt-4 bg-[#00d4aa]/5 border border-[#00d4aa]/10 rounded-lg px-3 py-2">
                All set. You can start running Skills.
              </p>
            )}
          </section>
        )}

        {/* Balance Summary */}
        {isConnected && (
          <section className="bg-gradient-to-br from-[#00d4aa]/10 to-[#111] border border-[#00d4aa]/20 rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Balance Overview</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a]/60 rounded-xl p-4">
                <p className="text-xs text-[#666] uppercase tracking-wide mb-1">Wallet USDC</p>
                <p className="text-2xl font-bold text-white">
                  {usdcBalance.toFixed(2)}
                </p>
                <p className="text-xs text-[#555] mt-1">On-chain holdings</p>
              </div>
              <div className="bg-[#0a0a0a]/60 rounded-xl p-4 border border-[#00d4aa]/20">
                <p className="text-xs text-[#00d4aa]/70 uppercase tracking-wide mb-1">Platform Balance</p>
                <p className="text-2xl font-bold text-[#00d4aa]">
                  {platformAvailable.toFixed(4)}
                </p>
                <p className="text-xs text-[#555] mt-1">Available for Skills</p>
              </div>
              <div className="bg-[#0a0a0a]/60 rounded-xl p-4">
                <p className="text-xs text-[#666] uppercase tracking-wide mb-1">Approved Limit</p>
                <p className="text-2xl font-bold text-white">
                  {isUnlimited ? '∞' : authorizedAmount.toFixed(2)}
                </p>
                <p className="text-xs text-[#555] mt-1">Escrow spending cap</p>
              </div>
            </div>
            {platformBalance && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-[#0a0a0a]/40 rounded-lg px-3 py-2.5 text-xs">
                  <span className="text-[#555]">Total deposited</span>
                  <span className="text-[#888]">${(platformBalance.total_deposited / 1_000_000).toFixed(4)}</span>
                </div>
                <div className="flex items-center justify-between bg-[#0a0a0a]/40 rounded-lg px-3 py-2.5 text-xs">
                  <span className="text-[#555]">Total spent</span>
                  <span className="text-[#888]">${(platformBalance.total_spent / 1_000_000).toFixed(4)}</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Step 1: Authorize */}
        <section className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step1Done ? 'bg-[#00d4aa] text-black' : 'bg-[#333] text-[#888]'
            }`}>
              {step1Done ? '✓' : '1'}
            </div>
            <div>
              <h2 className="font-semibold">Authorize Escrow to spend USDC</h2>
              <p className="text-xs text-[#555] mt-0.5">
                This only grants permission — no funds are moved
              </p>
            </div>
          </div>

          {!isConnected ? (
            <p className="text-[#666] text-sm">Connect your wallet to continue</p>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap">
                {APPROVE_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setApproveAmount(String(preset))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      approveAmount === String(preset)
                        ? 'border-[#00d4aa] text-[#00d4aa] bg-[#00d4aa]/10'
                        : 'border-[#222] text-[#666] hover:border-[#444]'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
                <button
                  onClick={() => setApproveAmount('max')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    approveAmount === 'max'
                      ? 'border-[#00d4aa] text-[#00d4aa] bg-[#00d4aa]/10'
                      : 'border-[#222] text-[#666] hover:border-[#444]'
                  }`}
                >
                  Unlimited
                </button>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]">$</span>
                  <input
                    type={approveAmount === 'max' ? 'text' : 'number'}
                    value={approveAmount === 'max' ? 'Unlimited' : approveAmount}
                    onChange={e => setApproveAmount(e.target.value)}
                    disabled={approveAmount === 'max'}
                    min="1"
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl pl-8 pr-4 py-3 text-white focus:border-[#00d4aa] outline-none disabled:text-[#666]"
                  />
                </div>
                <button
                  onClick={handleApprove}
                  disabled={isLoading || (!approveAmount || (approveAmount !== 'max' && Number(approveAmount) <= 0))}
                  className="bg-[#00d4aa] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#00b894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isLoading ? 'Approving...' : approved ? 'Approved ✓' : 'Authorize'}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isApproved ? 'bg-[#00d4aa]' : 'bg-[#333]'}`} />
                <span className="text-[#666]">Current approval:</span>
                <span className={isApproved ? 'text-[#00d4aa]' : 'text-[#444]'}>
                  {isUnlimited ? 'Unlimited' : `$${authorizedAmount.toFixed(2)} USDC`}
                </span>
              </div>

              <div className="bg-[#0a0a0a] rounded-xl p-4 space-y-2 text-xs border border-[#1a1a1a]">
                <div className="flex justify-between">
                  <span className="text-[#555]">USDC Contract</span>
                  <span className="font-mono text-[#444]">{USDC_ADDRESS.slice(0, 10)}...{USDC_ADDRESS.slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#555]">Escrow Contract</span>
                  <span className="font-mono text-[#444]">{ESCROW_ADDRESS.slice(0, 10)}...{ESCROW_ADDRESS.slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#555]">Network</span>
                  <span className="text-[#444]">X Layer Testnet (1952)</span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Step 2: Deposit */}
        <section className={`bg-[#111] border rounded-xl p-6 space-y-4 transition-opacity ${
          !isConnected ? 'opacity-50' : step1Done ? 'border-[#00d4aa]/20' : 'border-[#1a1a1a] opacity-60'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step2Done ? 'bg-[#00d4aa] text-black' : 'bg-[#333] text-[#888]'
            }`}>
              {step2Done ? '✓' : '2'}
            </div>
            <div>
              <h2 className="font-semibold">Deposit funds to platform</h2>
              <p className="text-xs text-[#555] mt-0.5">
                Deposited funds appear as your platform balance — Skills are charged from here
              </p>
            </div>
          </div>

          {!isConnected ? (
            <p className="text-[#666] text-sm">Connect your wallet to continue</p>
          ) : !step1Done ? (
            <p className="text-[#555] text-sm">Complete step 1 (Authorize) first</p>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap">
                {DEPOSIT_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setDepositAmount(String(preset))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      depositAmount === String(preset)
                        ? 'border-[#00d4aa] text-[#00d4aa] bg-[#00d4aa]/10'
                        : 'border-[#222] text-[#666] hover:border-[#444]'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]">$</span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    min="1"
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl pl-8 pr-16 py-3 text-white focus:border-[#00d4aa] outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#555]">USDC</span>
                </div>
                <button
                  onClick={handleDeposit}
                  disabled={depositing || !depositAmount || Number(depositAmount) <= 0}
                  className="bg-[#00d4aa] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#00b894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {depositing ? 'Depositing...' : depositSuccess ? 'Deposited ✓' : 'Deposit'}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${step2Done ? 'bg-[#00d4aa]' : 'bg-[#333]'}`} />
                <span className="text-[#666]">Platform balance:</span>
                <span className={step2Done ? 'text-[#00d4aa]' : 'text-[#444]'}>
                  ${platformAvailable.toFixed(4)} USDC
                </span>
              </div>

              <div className="bg-[#00d4aa]/5 border border-[#00d4aa]/10 rounded-lg px-4 py-3 text-xs text-[#888] space-y-1">
                <p>• Approve only grants permission — it does not move any funds</p>
                <p>• Deposit moves USDC into the platform so you can run Skills</p>
                <p>• Each Skill execution is charged from your platform balance</p>
              </div>
            </>
          )}
        </section>

        {/* Profile */}
        <section className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">Profile</h2>
          <div>
            <label className="block text-sm text-[#888] mb-1.5">Display name</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:border-[#00d4aa] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#888] mb-1.5">Wallet address</label>
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-[#666] font-mono text-sm break-all">
              {address || 'No wallet connected'}
            </div>
          </div>
          <button
            onClick={saveProfile}
            className="bg-[#00d4aa] text-black font-bold px-5 py-2.5 rounded-xl hover:bg-[#00b894] transition-colors text-sm"
          >
            {saved ? 'Saved ✓' : 'Save'}
          </button>
        </section>
      </div>
    </div>
  )
}
