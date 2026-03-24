interface ProofEvent {
  seq: number
  proofHash: string
  txHash?: string
  ts: string
}

export default function ProofHeartbeatTimeline({ proofs }: { proofs: ProofEvent[] }) {
  return (
    <div className="border border-border-subtle p-8 bg-surface-elevated h-full">
      <p className="text-text-tertiary text-xs uppercase tracking-widest mb-6">
        Proof Heartbeats ({proofs.length})
      </p>
      <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-2">
        {proofs.length === 0 ? (
          <p className="text-text-tertiary text-sm italic">Awaiting proofs...</p>
        ) : (
          [...proofs].reverse().map((proof) => (
            <div key={`${proof.seq}-${proof.proofHash}`} className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 bg-accent mt-1 flex-shrink-0" />
              <div>
                <div className="text-accent font-mono font-bold uppercase tracking-widest">#{proof.seq} ✓ Anchored</div>
                <div className="text-text-secondary font-mono truncate mt-1">{proof.proofHash.slice(0, 16)}...</div>
                <div className="text-text-tertiary mt-1">{new Date(proof.ts).toLocaleTimeString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
