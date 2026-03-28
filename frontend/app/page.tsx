import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <section className="mx-auto max-w-[1920px] px-4 sm:px-8 lg:px-24 py-48">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-24">
          <div className="lg:col-span-8">
            <h1 className="font-display text-4xl sm:text-6xl lg:text-[7rem] font-bold leading-[0.9] tracking-tight mb-12">
              AI Agents.
              <br />
              <span className="italic font-normal">Streaming value.</span>
            </h1>
            <p className="text-2xl leading-relaxed text-text-secondary max-w-3xl">
              Curators deploy AI agents. Users pay by the second. Payments stream while proofs hold.
              The marketplace where AI labor is metered, verified, and settled on-chain.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col justify-end items-start gap-8">
            <Link 
              href="/agents"
              className="group flex items-center gap-4 border-b border-text-primary pb-2 text-xl font-medium transition-colors hover:text-accent hover:border-accent"
            >
              Browse Agents
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
            <Link 
              href="/agents/new"
              className="group flex items-center gap-4 border-b border-text-tertiary pb-2 text-xl font-medium text-text-secondary transition-colors hover:text-text-primary hover:border-text-primary"
            >
              Upload Agent
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1920px] px-4 sm:px-8 lg:px-24 pb-48">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-24">
          {[
            {
              role: 'Agent Curator',
              description: 'Configure your agent with prompts, tools, and pricing. Earn USDC while users run it.',
              action: 'Deploy Agent',
              href: '/agents/new',
              statLabel: 'REVENUE',
              statValue: 'Per-second',
            },
            {
              role: 'Platform',
              description: 'Hosts the agent runtime, submits on-chain proofs, and ensures trustless settlement.',
              action: null,
              href: null,
              statLabel: 'FEE',
              statValue: '0%',
            },
            {
              role: 'User',
              description: 'Browse the catalog. Pay for agent compute by the second in USDC. No lock-ins.',
              action: 'Browse Agents',
              href: '/agents',
              statLabel: 'COST',
              statValue: 'Pay-as-you-go',
            },
          ].map(card => (
            <div key={card.role} className="col-span-12 md:col-span-4 flex flex-col">
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

      <section className="mx-auto max-w-[1920px] px-4 sm:px-8 lg:px-24 pb-48">
        <div className="grid grid-cols-2 md:grid-cols-4 border border-border-subtle divide-y md:divide-y-0 md:divide-x divide-border-subtle">
          {[
            { label: 'Proof Interval', value: '3-5s', subtitle: 'On-chain heartbeat' },
            { label: 'Minimum', value: '$0.0001', subtitle: 'Per second' },
            { label: 'Gas Costs', value: '< $0.001', subtitle: 'X Layer efficiency' },
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
