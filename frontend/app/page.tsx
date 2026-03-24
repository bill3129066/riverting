import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <section className="mx-auto max-w-[1920px] px-24 py-48">
        <div className="grid grid-cols-12 gap-24">
          <div className="col-span-8">
            <h1 className="font-display text-[7rem] font-bold leading-[0.9] tracking-tight mb-12">
              AI Agents.<br />
              <span className="italic font-normal">Pay Per Second.</span>
            </h1>
            <p className="text-2xl leading-relaxed text-text-secondary max-w-3xl">
              Curators upload AI agents. Users pay per-second. Proof stops, payment stops.
              The first marketplace where AI labor is metered, verified, and settled on-chain.
            </p>
          </div>
          <div className="col-span-4 flex flex-col justify-end items-start gap-8">
            <Link 
              href="/marketplace"
              className="group flex items-center gap-4 border-b border-text-primary pb-2 text-xl font-medium transition-colors hover:text-accent hover:border-accent"
            >
              Browse Agents
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
            <Link 
              href="/curator"
              className="group flex items-center gap-4 border-b border-text-tertiary pb-2 text-xl font-medium text-text-secondary transition-colors hover:text-text-primary hover:border-text-primary"
            >
              Upload Agent
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1920px] px-24 pb-48">
        <div className="grid grid-cols-12 gap-24">
          {[
            {
              role: 'Agent Curator',
              description: 'Upload a skill config — system prompt, tools, pricing. Your agent earns while users work with it.',
              action: 'Upload Agent',
              href: '/curator/agents/new',
              statLabel: 'REVENUE',
              statValue: 'Rate/sec',
            },
            {
              role: 'Platform',
              description: 'We host the LLM runtime, submit on-chain proofs every 3-5 seconds, and handle billing.',
              action: null,
              href: null,
              statLabel: 'FEE',
              statValue: '0%',
            },
            {
              role: 'User',
              description: 'Browse agents, pay per-second in USDC. No subscription. Stop anytime. Only pay for real work.',
              action: 'Browse Agents',
              href: '/marketplace',
              statLabel: 'COST',
              statValue: 'Pay-as-you-go',
            },
          ].map(card => (
            <div key={card.role} className="col-span-4 flex flex-col">
              <h3 className="font-display text-4xl font-bold italic mb-8">{card.role}</h3>
              <div className="h-px w-12 bg-text-primary mb-8"></div>
              <div className="flex-grow flex flex-col">
                <p className="text-text-secondary mb-8">{card.description}</p>
                {card.action && card.href ? (
                  <div className="mb-12">
                    <Link href={card.href} className="group inline-flex items-center gap-2 border-b border-text-tertiary pb-1 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary hover:border-text-primary">
                      {card.action}
                      <span className="material-symbols-outlined text-[1rem] transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </Link>
                  </div>
                ) : (
                  <div className="mb-12"></div>
                )}
              </div>
              <div className="bg-surface-dim p-8">
                <div className="text-xs uppercase tracking-widest text-text-secondary mb-4">{card.statLabel}</div>
                <div className="font-display text-4xl font-bold text-accent">{card.statValue}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1920px] px-24 pb-48">
        <div className="grid grid-cols-4 border border-border-subtle divide-x divide-border-subtle">
          {[
            { label: 'Proof Interval', value: '3-5s', subtitle: 'On-chain heartbeat' },
            { label: 'Min Cost', value: '$0.001', subtitle: 'Per query' },
            { label: 'Gas per Proof', value: '< $0.001', subtitle: 'X Layer rollup' },
            { label: 'Settlement', value: 'Instant', subtitle: 'Trustless escrow' },
          ].map((stat) => (
            <div key={stat.label} className="p-12">
              <div className="text-xs uppercase tracking-widest text-text-tertiary mb-6">{stat.label}</div>
              <div className="font-display text-5xl font-bold text-text-primary mb-4">{stat.value}</div>
              <div className="text-accent font-medium text-sm">{stat.subtitle}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
