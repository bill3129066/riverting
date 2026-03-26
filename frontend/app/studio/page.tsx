'use client'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { fetchAgents } from '@/lib/agents-api'

export default function StudioPage() {
  const { address } = useAccount()
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }
    fetchAgents({ creator: address })
      .then(setAgents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  const totalEarned = 0 // Will be populated from settlement service
  const pendingPayout = 0

  return (
    <div className="bg-background min-h-screen text-text-primary font-sans">
      <div className="max-w-[1920px] mx-auto px-6 md:px-24 pt-24 pb-32">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b-2 border-text-primary pb-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-border-strong opacity-50 -mt-12 -mr-12 pointer-events-none"></div>
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-text-primary text-surface px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] font-bold">
                SYS.ADM_CTRL
              </span>
              <span className="text-accent text-[10px] font-mono uppercase tracking-widest border border-accent px-2 py-1">
                STATUS: ONLINE
              </span>
            </div>
            <h1 className="font-display font-bold text-5xl md:text-7xl leading-none tracking-tighter mb-6 uppercase">
              Creator Studio
            </h1>
            <div className="flex items-center gap-0 border border-border-strong inline-flex bg-surface">
              <span className="text-text-secondary text-xs font-mono border-r border-border-strong px-4 py-2 uppercase tracking-widest bg-surface-dim">
                WALLET_ID
              </span>
              <span className="text-text-primary font-mono text-sm px-4 py-2 font-bold">
                {address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'DISCONNECTED'}
              </span>
              {address && (
                <button 
                  type="button"
                  onClick={() => navigator.clipboard.writeText(address)}
                  className="text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors border-l border-border-strong px-4 py-2 flex items-center"
                  title="Copy address"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
              )}
            </div>
          </div>
          
          <Link
            href="/agents/new"
            className="mt-8 md:mt-0 bg-accent text-accent-foreground font-mono text-xs uppercase tracking-[0.2em] font-bold px-8 py-4 hover:bg-text-primary transition-colors border-2 border-transparent hover:border-accent flex items-center gap-3 group relative overflow-hidden"
          >
            <span className="material-symbols-outlined text-sm group-hover:rotate-90 transition-transform">add</span>
            Upload Agent
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20 group-hover:bg-accent/50"></div>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-text-primary mb-24 relative bg-surface shadow-[8px_8px_0_var(--text-primary)]">
          <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r-2 border-text-primary relative group">
            <div className="absolute top-4 right-4 text-text-tertiary font-mono text-[10px]">{"01 //"}</div>
            <p className="text-text-secondary text-xs font-mono uppercase tracking-[0.2em] font-bold mb-4">Total Earned</p>
            <p className="font-display text-5xl md:text-6xl text-text-primary tracking-tight">
              <span className="text-text-tertiary mr-2 font-sans font-light">$</span>{totalEarned.toFixed(4)}
            </p>
          </div>
          <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r-2 border-text-primary relative bg-surface-dim">
            <div className="absolute top-4 right-4 text-text-tertiary font-mono text-[10px]">{"02 //"}</div>
            <p className="text-text-secondary text-xs font-mono uppercase tracking-[0.2em] font-bold mb-4">Active Agents</p>
            <p className="font-display text-5xl md:text-6xl text-accent tracking-tight flex items-baseline">
              {agents.filter(a => a.active).length}
              <span className="text-text-tertiary text-2xl md:text-3xl ml-2 font-mono tracking-normal">/ {agents.length}</span>
            </p>
          </div>
          <div className="p-8 md:p-12 relative">
            <div className="absolute top-4 right-4 text-text-tertiary font-mono text-[10px]">{"03 //"}</div>
            <p className="text-text-secondary text-xs font-mono uppercase tracking-[0.2em] font-bold mb-4">Pending Payout</p>
            <p className="font-display text-5xl md:text-6xl text-text-primary tracking-tight">
              <span className="text-text-tertiary mr-2 font-sans font-light">$</span>{pendingPayout.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Agent list */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24">
          <div className="md:col-span-3">
            <h2 className="font-mono text-sm font-bold border-b-2 border-text-primary pb-4 mb-6 uppercase tracking-[0.2em]">
              Network Nodes
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed font-sans">
              Manage deployed agent instances. Revenue streams generated per second of compute time utilized by external clients.
            </p>
            <div className="mt-8 border border-border-strong p-4 bg-surface-dim">
              <div className="flex items-center gap-2 text-xs font-mono text-text-secondary uppercase mb-2">
                <span className="w-2 h-2 bg-accent animate-pulse"></span>
                System Health
              </div>
              <div className="h-1 w-full bg-border-subtle mt-1">
                <div className="h-full bg-accent w-full"></div>
              </div>
            </div>
          </div>
          <div className="md:col-span-9">
            {loading ? (
              <div className="space-y-4 border-t-2 border-text-primary pt-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse border border-border-strong py-8 px-8 bg-surface-dim">
                    <div className="h-8 bg-border-strong w-1/3 mb-4" />
                    <div className="h-4 bg-border-strong w-1/4 mb-4" />
                    <div className="h-4 bg-border-strong w-1/2" />
                  </div>
                ))}
              </div>
            ) : agents.length === 0 ? (
              <div className="border-2 border-text-primary p-16 md:p-24 flex flex-col items-center justify-center text-center bg-surface relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNjNmM2YzYiLz48L3N2Zz4=')] opacity-20"></div>
                <span className="material-symbols-outlined text-6xl text-border-strong mb-6 relative z-10">smart_toy</span>
                <h3 className="font-display italic text-3xl mb-4 text-text-primary relative z-10">No agents active</h3>
                <p className="text-text-secondary text-base mb-10 max-w-md relative z-10">
                  Deploy your first AI agent to initialize network connections and begin streaming USDC revenue.
                </p>
                <Link href="/agents/new" className="font-mono text-xs font-bold uppercase tracking-[0.2em] border-b-2 border-accent text-accent hover:text-text-primary hover:border-text-primary transition-colors pb-1 flex items-center gap-2 relative z-10">
                  Upload your first agent <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {agents.map(agent => (
                  <Link 
                    href={`/agents/${agent.id}`} 
                    key={agent.id} 
                    className="border border-border-strong hover:border-text-primary p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-surface transition-all group relative shadow-[4px_4px_0_var(--border-subtle)] hover:shadow-[4px_4px_0_var(--text-primary)] hover:-translate-y-1 hover:-translate-x-1"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-accent scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                    
                    <div className="pl-2 md:pl-6 w-full md:w-auto">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="font-display italic text-3xl font-bold text-text-primary group-hover:text-accent transition-colors">
                          {agent.name}
                        </h3>
                        <span className="text-[10px] font-mono border border-border-strong px-2 py-1 text-text-tertiary uppercase tracking-widest bg-surface-dim">
                          ID: {agent.id.slice(0,8)}
                        </span>
                      </div>
                      <p className="text-text-secondary text-xs font-mono mb-6 uppercase tracking-[0.2em] font-bold">
                        CAT: {agent.category}
                      </p>
                      <div className="flex flex-wrap items-center gap-6 md:gap-10 border-t border-border-subtle pt-4">
                        <span className="text-text-primary text-sm font-mono flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-text-tertiary">payments</span>
                          <span className="font-bold">${((agent.curator_rate_per_second || agent.creator_rate_per_second || 0) / 1_000_000).toFixed(4)}/SEC</span>
                        </span>
                        <span className="text-text-secondary text-sm font-mono flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-text-tertiary">account_balance_wallet</span>
                          <span>$0.0000 EARNED</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end gap-3 mt-6 md:mt-0 pl-2 md:pl-0 w-full md:w-auto border-t md:border-t-0 border-border-subtle pt-4 md:pt-0">
                      <span className={`text-[10px] font-mono uppercase tracking-[0.2em] font-bold px-3 py-1.5 flex items-center gap-2 ${agent.active ? 'bg-accent text-surface' : 'bg-surface-dim text-text-secondary border border-border-strong'}`}>
                        {agent.active && <span className="w-1.5 h-1.5 bg-surface animate-pulse rounded-full"></span>}
                        {agent.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <span className="text-xs text-text-tertiary font-mono group-hover:text-accent transition-colors uppercase tracking-widest mt-2 hidden md:flex items-center gap-1">
                        ACCESS <span className="material-symbols-outlined text-sm">arrow_outward</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
