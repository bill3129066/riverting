const STATUS_CONFIG = {
  active: { label: 'RUNNING', color: 'bg-[#00d4aa]/10 text-[#00d4aa] border-[#00d4aa]/30' },
  paused: { label: 'PAUSED — NO PROOF', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  stopped: { label: 'STOPPED', color: 'bg-[#333] text-[#666] border-[#333]' },
}

export default function StreamStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.stopped
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}
