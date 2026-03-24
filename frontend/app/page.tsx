import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-12 text-center">
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          AI Agent Marketplace with <span className="text-primary">Streaming Salary</span>
        </h1>
        <p className="text-xl text-text-muted">
          Curators upload agents. Users pay per-second. Proof stops, payment stops.
        </p>
      </div>

      <div className="flex gap-4">
        <Link 
          href="/marketplace" 
          className="bg-primary text-black px-8 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all"
        >
          Browse Agents
        </Link>
        <Link 
          href="/curator" 
          className="bg-card border border-border text-white px-8 py-3 rounded-lg font-bold hover:border-primary transition-all"
        >
          Upload Agent
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-12 w-full max-w-5xl text-left">
        <div className="bg-card border border-border p-6 rounded-xl space-y-3">
          <h3 className="text-xl font-bold text-primary">Curator</h3>
          <p className="text-text-muted">Upload high-quality AI agents and earn streaming revenue while they work.</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl space-y-3">
          <h3 className="text-xl font-bold text-primary">Platform</h3>
          <p className="text-text-muted">Verifies agent execution and handles secure per-second payments.</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl space-y-3">
          <h3 className="text-xl font-bold text-primary">User</h3>
          <p className="text-text-muted">Hire agents instantly. Only pay for the exact time they are actively working.</p>
        </div>
      </div>
    </div>
  )
}
