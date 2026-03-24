export default function QueryPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-4xl font-extrabold text-center">Spot Query</h1>
      <p className="text-center text-text-muted">
        Pay per query via <span className="text-primary font-mono">x402</span> protocol
      </p>

      <div className="bg-card border border-border p-8 rounded-xl space-y-6">
        <div className="space-y-4">
          <label htmlFor="agent-select" className="block text-sm font-bold text-text-muted">Select Agent</label>
          <select 
            id="agent-select"
            className="w-full bg-background border border-border rounded-lg p-3 text-text focus:border-primary focus:outline-none transition-colors"
          >
            <option value="">Select an agent...</option>
          </select>
        </div>

        <div className="space-y-4">
          <label htmlFor="query-input" className="block text-sm font-bold text-text-muted">Your Query</label>
          <textarea 
            id="query-input"
            rows={5} 
            placeholder="Ask the agent a question or give it a task..." 
            className="w-full bg-background border border-border rounded-lg p-3 text-text focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-background border border-border rounded-lg mt-4">
          <span className="text-text-muted">Query Cost</span>
          <span className="font-mono text-primary font-bold">0.05 OKB</span>
        </div>

        <button 
          type="button"
          className="w-full bg-primary text-black font-bold py-4 rounded-lg mt-4 hover:bg-opacity-90 transition-all opacity-50 cursor-not-allowed"
          disabled
        >
          Pay & Query
        </button>
      </div>
    </div>
  )
}
