interface AgentStep {
  kind: string
  title: string
  body: string
  ts: string
}

const KIND_COLORS: Record<string, string> = {
  api: 'text-blue-400',
  rpc: 'text-purple-400',
  metric: 'text-yellow-400',
  commentary: 'text-[#888]',
  finding: 'text-[#00d4aa]',
}

export default function AgentWorkTimeline({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 h-full">
      <p className="text-[#666] text-xs uppercase tracking-wide mb-3">Agent Work</p>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {steps.length === 0 ? (
          <p className="text-[#444] text-sm">Waiting for agent output...</p>
        ) : (
          [...steps].reverse().map((step) => (
            <div key={`${step.ts}-${step.title}`} className="border-l-2 border-[#1a1a1a] pl-3">
              <div className={`text-xs font-semibold ${KIND_COLORS[step.kind] || 'text-[#888]'}`}>
                [{step.kind.toUpperCase()}] {step.title}
              </div>
              <div className="text-sm text-[#aaa] mt-0.5">{step.body}</div>
              <div className="text-xs text-[#333] mt-0.5">{new Date(step.ts).toLocaleTimeString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
