export default function CostBreakdown({ curatorRate, platformFee }: {
  curatorRate: number
  platformFee: number
}) {
  function formatRate(units: number): string {
    return `$${(units / 1_000_000).toFixed(4)}/sec`
  }

  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
      <p className="text-[#666] text-xs uppercase tracking-wide mb-3">Cost Breakdown</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#666]">Curator</span>
          <span>{formatRate(curatorRate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666]">Platform</span>
          <span>{formatRate(platformFee)}</span>
        </div>
        <div className="flex justify-between font-bold text-[#00d4aa] border-t border-[#1a1a1a] pt-2">
          <span>Total</span>
          <span>{formatRate(curatorRate + platformFee)}</span>
        </div>
      </div>
    </div>
  )
}
