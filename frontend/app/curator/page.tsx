import Link from 'next/link'

export default function CuratorDashboardPage() {
  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold">Curator Dashboard</h1>
        <Link 
          href="/curator/agents/new" 
          className="bg-primary text-black px-6 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all"
        >
          Upload New Agent
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-card border border-border rounded-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold">Earnings</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <span className="text-text-muted">Total Earned</span>
              <span className="text-3xl font-mono text-primary">0.00 OKB</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-text-muted">Streaming Revenue</span>
              <span className="text-xl font-mono text-primary animate-pulse">+0.00 / sec</span>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-8 space-y-6">
          <h2 className="text-2xl font-bold">My Agents</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border-2 border-dashed border-border rounded-lg">
            <p className="text-text-muted">You haven't uploaded any agents yet.</p>
            <Link 
              href="/curator/agents/new" 
              className="text-primary hover:underline font-medium"
            >
              Upload your first agent →
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
