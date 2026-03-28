import { formatUSDC } from '@/lib/utils'

export default function SalaryTicker({ accrued, ratePerSec, status }: {
  accrued: number
  ratePerSec: number
  status: string
}) {
  return (
    <div className="border border-border-subtle p-8 bg-surface-elevated">
      <p className="text-text-tertiary text-xs uppercase tracking-widest mb-4">Session Cost</p>
      <div 
        className={`text-6xl font-display font-bold transition-colors ${
          status === 'active' ? 'text-accent' : 'text-text-tertiary'
        }`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatUSDC(accrued)}
      </div>
      <div className="flex items-center gap-3 mt-6">
        <div 
          className={`w-2 h-2 ${
            status === 'active' ? 'bg-accent' : 'bg-text-tertiary'
          }`}
          style={status === 'active' ? { animation: 'breathe 2s ease-in-out infinite' } : {}}
        />
        <span className="text-xs uppercase tracking-widest text-text-secondary">
          {status === 'active' ? `${formatUSDC(ratePerSec)}/sec` : status}
        </span>
      </div>
    </div>
  )
}
