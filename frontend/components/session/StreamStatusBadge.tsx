const STATUS_CONFIG = {
  active: { label: 'RUNNING', color: 'bg-accent/10 text-accent border border-accent/30' },
  paused: { label: 'PAUSED — NO PROOF', color: 'bg-warning/10 text-warning border border-warning/30' },
  stopped: { label: 'STOPPED', color: 'bg-surface-dim text-text-tertiary border border-border-subtle' },
}

export default function StreamStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.stopped
  return (
    <span className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}
