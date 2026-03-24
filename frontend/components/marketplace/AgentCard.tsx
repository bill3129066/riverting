export interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
  curator_rate_per_second: number;
  curator_wallet: string;
  active: number;
}

const PLATFORM_FEE = 300;

function formatRate(units: number): string {
  return `$${(units / 1_000_000).toFixed(4)}/sec`;
}

export default function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const totalRate = agent.curator_rate_per_second + PLATFORM_FEE;

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 cursor-pointer hover:border-[#00d4aa] transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,212,170,0.1)] flex flex-col h-full text-left w-full"
    >
      <div className="flex-1 w-full">
        <span className="inline-block text-xs bg-[#00d4aa]/10 text-[#00d4aa] px-2 py-1 rounded-full uppercase tracking-wide">
          {agent.category}
        </span>
        
        <h3 className="text-lg font-semibold mt-3 mb-1">{agent.name}</h3>
        
        <p className="text-[#888] text-sm mb-4 line-clamp-2">{agent.description}</p>
      </div>
      
      <div className="border-t border-[#1a1a1a] pt-3 mt-auto space-y-1 w-full">
        <div className="flex justify-between text-xs text-[#666]">
          <span>Curator</span>
          <span>{formatRate(agent.curator_rate_per_second)}</span>
        </div>
        <div className="flex justify-between text-xs text-[#666]">
          <span>Platform</span>
          <span>{formatRate(PLATFORM_FEE)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-[#00d4aa]">
          <span>Total</span>
          <span>{formatRate(totalRate)}</span>
        </div>
      </div>
    </button>
  );
}
