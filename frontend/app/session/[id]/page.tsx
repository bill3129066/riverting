export default function SessionPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold flex items-center gap-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          Live Session <span className="text-text-muted text-xl font-mono">#{params.id}</span>
        </h1>
        <button 
          type="button"
          className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-2 rounded-lg font-bold hover:bg-red-500/20 transition-all"
        >
          Stop Session
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-grow">
        <div className="col-span-12 md:col-span-3 space-y-6 flex flex-col">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
            <h2 className="text-lg font-bold mb-4">Salary Stream</h2>
            <div className="flex-grow flex flex-col justify-center items-center text-center space-y-2">
              <span className="text-sm text-text-muted">Total Paid</span>
              <span className="text-4xl font-mono text-primary animate-pulse">0.000 OKB</span>
              <span className="text-sm font-mono text-text-muted mt-4">Rate: 0.001 OKB/s</span>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 space-y-6 flex flex-col">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
            <h2 className="text-lg font-bold mb-4">Agent Work</h2>
            <div className="flex-grow bg-background border border-border rounded-lg p-4 font-mono text-sm overflow-y-auto">
              <div className="text-text-muted opacity-50">Initializing agent environment...</div>
              <div className="text-text-muted opacity-50 mt-2">Connecting to secure enclave...</div>
            </div>
            <div className="mt-4 flex gap-2">
              <input 
                type="text" 
                placeholder="Send a prompt to the agent..." 
                className="flex-grow bg-background border border-border rounded-lg px-4 py-2 text-text focus:border-primary focus:outline-none transition-colors"
                aria-label="Agent prompt input"
              />
              <button 
                type="button"
                className="bg-primary text-black px-6 font-bold rounded-lg hover:bg-opacity-90 transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-3 space-y-6 flex flex-col">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
            <h2 className="text-lg font-bold mb-4">Cryptographic Proofs</h2>
            <div className="flex-grow flex flex-col gap-3">
              <div className="bg-background border border-border rounded-lg p-3 text-xs font-mono text-text-muted opacity-50">
                Waiting for first proof generation...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
