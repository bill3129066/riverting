interface AgentStep {
  kind: string
  title: string
  body: string
  ts: string
}

const KIND_COLORS: Record<string, string> = {
  api: 'text-blue-600',
  rpc: 'text-purple-600',
  metric: 'text-yellow-600',
  commentary: 'text-text-secondary',
  finding: 'text-accent',
}

export default function AgentWorkTimeline({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="border border-border-subtle p-8 bg-surface-elevated h-full">
      <p className="text-text-tertiary text-xs uppercase tracking-widest mb-6">Agent Work</p>
      <div className="space-y-6 max-h-[32rem] overflow-y-auto pr-4">
        {steps.length === 0 ? (
          <p className="text-text-tertiary text-sm italic">Waiting for agent output...</p>
        ) : (
          [...steps].reverse().map((step) => (
            <div key={`${step.ts}-${step.title}`} className="border-l border-border-strong pl-6 py-1">
              <div className={`text-xs font-bold uppercase tracking-widest ${KIND_COLORS[step.kind] || 'text-text-secondary'}`}>
                [{step.kind}] {step.title}
              </div>
              <div className="text-base text-text-primary mt-2">{step.body}</div>
              <div className="text-xs font-mono text-text-tertiary mt-2">{new Date(step.ts).toLocaleTimeString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
