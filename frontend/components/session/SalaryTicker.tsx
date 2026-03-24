import { formatUSDC } from '@/lib/utils'

export default function SalaryTicker({ accrued, ratePerSec, status }: {
  accrued: number
  ratePerSec: number
  status: string
}) {

  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5">
      <p className="text-[#666] text-xs uppercase tracking-wide mb-2">Total Earned</p>
      <div className={`text-4xl font-mono font-bold transition-colors ${
        status === 'active' ? 'text-[#00d4aa]' : 'text-[#444]'
      }`}>
        {formatUSDC(accrued)}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <div className={`w-2 h-2 rounded-full ${
          status === 'active' ? 'bg-[#00d4aa] animate-pulse' : 'bg-[#444]'
        }`} />
        <span className="text-xs text-[#666]">
          {status === 'active' ? `${formatUSDC(ratePerSec)}/sec` : status.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
