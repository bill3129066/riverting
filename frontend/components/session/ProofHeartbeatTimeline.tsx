interface ProofEvent {
  seq: number
  proofHash: string
  txHash?: string
  ts: string
}

export default function ProofHeartbeatTimeline({ proofs }: { proofs: ProofEvent[] }) {
  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 h-full">
      <p className="text-[#666] text-xs uppercase tracking-wide mb-3">
        Proof Heartbeats ({proofs.length})
      </p>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {proofs.length === 0 ? (
          <p className="text-[#444] text-sm">Waiting for proofs...</p>
        ) : (
          [...proofs].reverse().map((proof) => (
            <div key={proof.seq} className="flex items-start gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-[#00d4aa] mt-1 flex-shrink-0" />
              <div>
                <div className="text-[#00d4aa] font-mono">#{proof.seq} ✓ Anchored</div>
                <div className="text-[#444] font-mono truncate">{proof.proofHash.slice(0, 16)}...</div>
                <div className="text-[#333]">{new Date(proof.ts).toLocaleTimeString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
