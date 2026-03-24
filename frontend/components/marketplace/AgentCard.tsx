import { PLATFORM_FEE, formatRate } from '@/lib/utils';

export interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
  curator_rate_per_second: number;
  curator_wallet: string;
  active: number;
}

export default function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const totalRate = agent.curator_rate_per_second + PLATFORM_FEE;

  return (
    <div 
      className="group grid grid-cols-1 md:grid-cols-3 gap-12 items-start py-8 border-t border-border-subtle hover:border-text-primary transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="md:col-span-1 flex flex-col items-start">
        <span className="bg-surface-dim px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-text-tertiary mb-6">
          {agent.category}
        </span>
        <h3 className="font-display font-bold text-4xl text-text-primary tracking-tight mb-4 group-hover:text-accent transition-colors">
          {agent.name}
        </h3>
        <div className="w-12 h-0.5 bg-accent/30 transition-all duration-300 group-hover:w-24 group-hover:bg-accent"></div>
      </div>
      
      <div className="md:col-span-2 flex flex-col h-full justify-between">
        <p className="text-text-secondary text-lg leading-relaxed mb-8 max-w-3xl">
          {agent.description}
        </p>
        
        <div className="grid grid-cols-3 border-t border-border-subtle pt-4 mt-auto items-end">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-text-tertiary mb-1">Curator</div>
            <div className="font-sans text-sm text-text-secondary">{formatRate(agent.curator_rate_per_second)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-text-tertiary mb-1">Platform</div>
            <div className="font-sans text-sm text-text-secondary">{formatRate(PLATFORM_FEE)}</div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-accent mb-1 font-bold">Total</div>
              <div className="font-sans text-lg text-accent font-bold">{formatRate(totalRate)}</div>
            </div>
            <button 
              className="bg-text-primary text-surface px-6 py-3 text-xs uppercase tracking-widest font-bold group-hover:bg-accent transition-colors"
            >
              Deploy Agent &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
