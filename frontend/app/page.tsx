import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-block bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-[#00d4aa] text-xs px-3 py-1 rounded-full mb-6 uppercase tracking-widest">
          X Layer OnchainOS Hackathon
        </div>
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          AI Agents.<br />
          <span className="text-[#00d4aa]">Pay Per Second.</span>
        </h1>
        <p className="text-xl text-[#888] mb-10 max-w-2xl mx-auto">
          Curators upload AI agents. Users pay per-second. Proof stops, payment stops.
          The first marketplace where AI labor is metered, verified, and settled on-chain.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/marketplace"
            className="bg-[#00d4aa] text-black font-bold px-8 py-4 rounded-xl hover:bg-[#00b894] transition-colors text-lg">
            Browse Agents →
          </Link>
          <Link href="/curator"
            className="border border-[#222] text-white px-8 py-4 rounded-xl hover:border-[#00d4aa] transition-colors text-lg">
            Upload Agent
          </Link>
        </div>
      </div>

      {/* Three-party explanation */}
      <div className="max-w-5xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              role: 'Agent Curator',
              icon: '🧠',
              description: 'Upload a skill config — system prompt, tools, pricing. Your agent earns while users work with it.',
              action: 'Upload Agent →',
              href: '/curator/agents/new',
              color: 'border-purple-500/30',
            },
            {
              role: 'Platform',
              icon: '⚡',
              description: 'We host the LLM runtime, submit on-chain proofs every 3-5 seconds, and handle billing.',
              action: null,
              href: null,
              color: 'border-[#00d4aa]/30',
            },
            {
              role: 'User',
              icon: '💰',
              description: 'Browse agents, pay per-second in USDC. No subscription. Stop anytime. Only pay for real work.',
              action: 'Browse Agents →',
              href: '/marketplace',
              color: 'border-blue-500/30',
            },
          ].map(card => (
            <div key={card.role} className={`bg-[#111] border ${card.color} rounded-2xl p-6`}>
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-bold text-lg mb-2">{card.role}</h3>
              <p className="text-[#666] text-sm mb-4">{card.description}</p>
              {card.action && card.href && (
                <Link href={card.href} className="text-[#00d4aa] text-sm hover:underline">
                  {card.action}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-t border-[#111] py-8">
        <div className="max-w-5xl mx-auto px-8 grid grid-cols-4 gap-8 text-center">
          {[
            { label: 'Proof Interval', value: '3-5s' },
            { label: 'Min Cost', value: '$0.001/query' },
            { label: 'Gas per Proof', value: '< $0.001' },
            { label: 'Settlement', value: 'On-chain' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-[#00d4aa]">{stat.value}</div>
              <div className="text-[#555] text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
