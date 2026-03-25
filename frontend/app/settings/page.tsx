'use client'
import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits, maxUint256 } from 'viem'

const USDC_ADDRESS = '0x74b7F16337b8972027F6196A17a631aC6dE26d22' as const
const ESCROW_ADDRESS = '0x93e2794E042b6326356768B7CfDeFc871008239e' as const
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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

export default function SettingsPage() {
  const { address, isConnected } = useAccount()
  const [approveAmount, setApproveAmount] = useState('100')
  const [displayName, setDisplayName] = useState('')
  const [saved, setSaved] = useState(false)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  const [activeSessions, setActiveSessions] = useState<any[]>([])

  useEffect(() => {
    setDisplayName(localStorage.getItem('riverting_display_name') || '')
  }, [])

  // Fetch active sessions to calculate locked balance
  useEffect(() => {
    if (!address) return
    fetch(`${API_BASE}/api/sessions`)
      .then(r => r.json())
      .then((sessions: any[]) => {
        setActiveSessions(sessions.filter(s => s.status === 'active' || s.status === 'paused'))
      })
      .catch(() => {})
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

  function saveProfile() {
    localStorage.setItem('riverting_display_name', displayName)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const usdcBalance = balance ? Number(formatUnits(balance as bigint, 6)) : 0
  const authorizedAmount = allowance ? Number(formatUnits(allowance as bigint, 6)) : 0
  const isUnlimited = allowance && (allowance as bigint) === maxUint256
  const lockedInSessions = activeSessions.reduce((sum, s) => sum + (s.deposit_amount || 0), 0) / 1_000_000
  const isLoading = approving || isPending

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-[#666] text-sm mt-1">帳戶設定與餘額管理</p>
        </div>

        {/* Platform Balance Summary */}
        {isConnected && (
          <section className="bg-gradient-to-br from-[#00d4aa]/10 to-[#111] border border-[#00d4aa]/20 rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">平台可用餘額</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a]/60 rounded-xl p-4">
                <p className="text-xs text-[#666] uppercase tracking-wide mb-1">錢包 USDC</p>
                <p className="text-2xl font-bold text-[#00d4aa]">
                  {usdcBalance.toFixed(4)}
                </p>
                <p className="text-xs text-[#555] mt-1">可用於開啟 Session</p>
              </div>
              <div className="bg-[#0a0a0a]/60 rounded-xl p-4">
                <p className="text-xs text-[#666] uppercase tracking-wide mb-1">已授權額度</p>
                <p className="text-2xl font-bold text-white">
                  {isUnlimited ? '∞' : authorizedAmount.toFixed(2)}
                </p>
                <p className="text-xs text-[#555] mt-1">Escrow 可動用上限</p>
              </div>
              <div className="bg-[#0a0a0a]/60 rounded-xl p-4">
                <p className="text-xs text-[#666] uppercase tracking-wide mb-1">Session 鎖定中</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {lockedInSessions.toFixed(4)}
                </p>
                <p className="text-xs text-[#555] mt-1">{activeSessions.length} 個進行中</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between bg-[#0a0a0a]/40 rounded-lg px-4 py-3">
              <span className="text-sm text-[#888]">實際可開啟新 Session 金額</span>
              <span className="text-lg font-bold text-[#00d4aa]">
                ${Math.max(0, usdcBalance - lockedInSessions).toFixed(4)} USDC
              </span>
            </div>
          </section>
        )}

        {/* Authorize Spending */}
        <section className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg">授權 Escrow 使用 USDC</h2>
            <p className="text-xs text-[#555] mt-1">
              授權後，啟動 Session 時 Escrow 合約可自動扣款，無需每次手動確認
            </p>
          </div>

          {!isConnected ? (
            <p className="text-[#666] text-sm">請先連接錢包</p>
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
                  無限額
                </button>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]">$</span>
                  <input
                    type={approveAmount === 'max' ? 'text' : 'number'}
                    value={approveAmount === 'max' ? '無限額授權' : approveAmount}
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

              {/* Current allowance status */}
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${authorizedAmount > 0 || isUnlimited ? 'bg-[#00d4aa]' : 'bg-[#333]'}`} />
                <span className="text-[#666]">目前授權：</span>
                <span className={authorizedAmount > 0 || isUnlimited ? 'text-[#00d4aa]' : 'text-[#444]'}>
                  {isUnlimited ? '無限額' : `$${authorizedAmount.toFixed(2)} USDC`}
                </span>
              </div>

              {/* Contract info */}
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

        {/* Profile */}
        <section className="bg-[#111] border border-[#1a1a1a] rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-lg">個人資料</h2>
          <div>
            <label className="block text-sm text-[#888] mb-1.5">顯示名稱</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="輸入你的顯示名稱"
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:border-[#00d4aa] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-[#888] mb-1.5">錢包地址</label>
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-[#666] font-mono text-sm break-all">
              {address || '未連接錢包'}
            </div>
          </div>
          <button
            onClick={saveProfile}
            className="bg-[#00d4aa] text-black font-bold px-5 py-2.5 rounded-xl hover:bg-[#00b894] transition-colors text-sm"
          >
            {saved ? '已儲存 ✓' : '儲存設定'}
          </button>
        </section>
      </div>
    </div>
  )
}
