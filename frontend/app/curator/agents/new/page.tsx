export default function UploadAgentPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-4xl font-extrabold text-center">Upload New Agent</h1>
      
      <form className="bg-card border border-border p-8 rounded-xl space-y-6">
        <div className="space-y-2">
          <label htmlFor="agent-name" className="block text-sm font-bold text-text-muted">Agent Name</label>
          <input 
            id="agent-name"
            type="text" 
            placeholder="e.g. Code Reviewer Bot" 
            className="w-full bg-background border border-border rounded-lg p-3 text-text focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="agent-desc" className="block text-sm font-bold text-text-muted">Description</label>
          <textarea 
            id="agent-desc"
            rows={4} 
            placeholder="What does this agent do?" 
            className="w-full bg-background border border-border rounded-lg p-3 text-text focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="agent-image" className="block text-sm font-bold text-text-muted">Docker Image</label>
          <input 
            id="agent-image"
            type="text" 
            placeholder="e.g. username/agent-image:latest" 
            className="w-full bg-background border border-border rounded-lg p-3 text-text focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="agent-salary" className="block text-sm font-bold text-text-muted">Salary per Second (OKB)</label>
          <input 
            id="agent-salary"
            type="number" 
            placeholder="0.00000001" 
            step="0.00000001"
            className="w-full bg-background border border-border rounded-lg p-3 text-text focus:border-primary focus:outline-none transition-colors font-mono"
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-primary text-black font-bold py-4 rounded-lg mt-8 hover:bg-opacity-90 transition-all opacity-50 cursor-not-allowed"
          disabled
        >
          Publish Agent
        </button>
      </form>
    </div>
  )
}
