'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { PLATFORM_FEE, formatRate } from '@/lib/utils';
import { createSession } from '@/lib/api';

export interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
  curator_rate_per_second: number;
  curator_wallet: string;
  active: number;
}

export default function AgentCard({ agent, expanded, onClick }: { agent: Agent; expanded?: boolean; onClick: () => void }) {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const totalRate = agent.curator_rate_per_second + PLATFORM_FEE;

  async function handleStartSession(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    setError(null);
    try {
      const { sessionId } = await createSession(agent.id, address!, agent.curator_rate_per_second);
      router.push(`/session/${sessionId}`);
    } catch (e: any) {
      setError(e.message || 'Failed to start session');
      setLoading(false);
    }
  }

  return (
    <div 
      role="button"
      tabIndex={0}
      className={`group grid grid-cols-1 md:grid-cols-3 gap-12 items-start py-8 w-full border-t border-border-subtle hover:border-text-primary transition-colors text-left cursor-pointer ${expanded ? 'border-text-primary' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <div className="md:col-span-1 flex flex-col items-start">
        <span className="bg-surface-dim px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-text-tertiary mb-6">
          {agent.category}
        </span>
        <h3 className="font-display font-bold text-4xl text-text-primary tracking-tight mb-4 group-hover:text-accent transition-colors">
          {agent.name}
        </h3>
        <div className={`h-0.5 bg-accent transition-all duration-300 ${expanded ? 'w-24' : 'w-12 bg-accent/30 group-hover:w-24 group-hover:bg-accent'}`}></div>
      </div>
      
      <div className="md:col-span-2 flex flex-col h-full justify-between">
        <p className="text-text-secondary text-lg leading-relaxed mb-8 max-w-3xl">
          {agent.description}
        </p>
        
        {expanded ? (
          <div 
            className="mt-auto animate-in fade-in slide-in-from-top-4 duration-300" 
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="mb-8 border-t border-border-subtle">
              <div className="flex justify-between text-sm py-4 border-b border-border-subtle">
                <span className="text-text-tertiary uppercase tracking-widest text-xs">Curator rate</span>
                <span className="font-sans text-text-secondary">{formatRate(agent.curator_rate_per_second)}</span>
              </div>
              <div className="flex justify-between text-sm py-4 border-b border-border-subtle">
                <span className="text-text-tertiary uppercase tracking-widest text-xs">Platform fee</span>
                <span className="font-sans text-text-secondary">{formatRate(PLATFORM_FEE)}</span>
              </div>
              <div className="flex justify-between py-4 border-b border-border-strong">
                <span className="text-accent font-bold uppercase tracking-widest text-xs flex items-center">You pay</span>
                <span className="text-accent font-bold text-xl">{formatRate(totalRate)}</span>
              </div>
            </div>

            <p className="text-[10px] uppercase tracking-widest text-text-tertiary mb-8">
              Curator Wallet: <span className="font-mono">{agent.curator_wallet}</span>
            </p>

            {error && <p className="text-error text-sm mb-4 bg-error/10 p-3 border border-error/20">{error}</p>}

            <div className="flex items-center gap-6">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openConnectModal?.(); }}
                  className="flex-1 bg-text-primary text-surface font-bold py-4 uppercase tracking-widest text-sm hover:bg-accent transition-colors"
                >
                  Connect Wallet to Start
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartSession}
                  disabled={loading}
                  className="flex-1 bg-text-primary text-surface font-bold py-4 uppercase tracking-widest text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Starting\u2026' : 'Start Session \u2192'}
                </button>
              )}
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="text-xs uppercase tracking-widest text-text-tertiary hover:text-text-primary font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 border-t border-border-subtle pt-4 mt-auto items-end">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-text-tertiary mb-1">Curator</div>
              <div className="font-sans text-sm text-text-secondary">{formatRate(agent.curator_rate_per_second)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-text-tertiary mb-1">Platform</div>
              <div className="font-sans text-sm text-text-secondary">{formatRate(PLATFORM_FEE)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-accent mb-1 font-bold">Total</div>
              <div className="font-sans text-lg text-accent font-bold">{formatRate(totalRate)}</div>
            </div>
            <div className="flex justify-end mt-6 col-span-3">
              <button 
                type="button"
                className="bg-text-primary text-surface px-8 py-3 text-xs uppercase tracking-widest font-bold group-hover:bg-accent transition-colors flex items-center gap-2"
                onClick={(e) => { e.stopPropagation(); onClick(); }}
              >
                Start Session
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
