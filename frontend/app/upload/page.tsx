'use client'
import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useRouter } from 'next/navigation'
import { createSkill } from '@/lib/skills-api'
import { signAction } from '@/lib/sign-action'

export default function UploadSkillPage() {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'general',
    systemPrompt: '',
    userPromptTemplate: '',
    model: 'gemini-2.0-flash',
    temperature: '0.3',
    maxTokens: '1024',
    pricePerRun: '0',
    executionMode: 'once',
    metadataUri: '',
  })
  const [inputFields, setInputFields] = useState<{ name: string; type: string; required: boolean }[]>([])

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const addInputField = () => {
    setInputFields(prev => [...prev, { name: '', type: 'text', required: true }])
  }

  const updateField = (index: number, key: string, value: string | boolean) => {
    setInputFields(prev => prev.map((f, i) => i === index ? { ...f, [key]: value } : f))
  }

  const removeField = (index: number) => {
    setInputFields(prev => prev.filter((_, i) => i !== index))
  }

  // Auto-detect {{variables}} from template
  const detectVariables = () => {
    const matches = form.userPromptTemplate.match(/\{\{(\w+)\}\}/g)
    if (!matches) return
    const vars = [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
    const existing = new Set(inputFields.map(f => f.name))
    const newFields = vars.filter(v => !existing.has(v)).map(v => ({ name: v, type: 'text', required: true }))
    if (newFields.length > 0) {
      setInputFields(prev => [...prev, ...newFields])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) { setError('Connect wallet first'); return }
    if (!form.name || !form.description || !form.systemPrompt) {
      setError('Name, description, and system prompt are required'); return
    }
    setLoading(true)
    setError('')

    try {
      // Build input schema from fields
      let inputSchemaJson: string | undefined
      if (inputFields.length > 0) {
        const schema: Record<string, unknown> = {
          type: 'object',
          properties: {} as Record<string, unknown>,
          required: inputFields.filter(f => f.required).map(f => f.name),
        }
        for (const field of inputFields) {
          (schema.properties as Record<string, unknown>)[field.name] = { type: field.type === 'number' ? 'number' : 'string' }
        }
        inputSchemaJson = JSON.stringify(schema)
      }

      const auth = await signAction(signMessageAsync, address, 'create-skill')

      await createSkill({
        name: form.name,
        description: form.description,
        category: form.category,
        systemPrompt: form.systemPrompt,
        userPromptTemplate: form.userPromptTemplate || undefined,
        model: form.model,
        temperature: parseFloat(form.temperature),
        maxTokens: parseInt(form.maxTokens),
        pricePerRun: parseInt(form.pricePerRun),
        executionMode: form.executionMode,
        metadataUri: form.metadataUri || undefined,
        inputSchemaJson,
      }, auth)

      router.push('/skills')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const priceInUSDC = (parseInt(form.pricePerRun || '0') / 1_000_000).toFixed(6)

  const inputCls = 'w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:border-[#00d4aa] outline-none'
  const labelCls = 'block text-sm text-[#888] mb-1.5'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Upload New Skill</h1>
        <p className="text-[#666] mb-8">Define a reusable AI skill that anyone can execute.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className={labelCls}>Skill Name *</label>
            <input value={form.name} onChange={update('name')} required placeholder="e.g. DeFi Pool Analyzer" className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description *</label>
            <textarea value={form.description} onChange={update('description')} required rows={2}
              placeholder="What does this skill do?"
              className={`${inputCls} resize-none`} />
          </div>

          {/* Category + Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={update('category')} className={inputCls}>
                <option value="general">General</option>
                <option value="defi">DeFi</option>
                <option value="trading">Trading</option>
                <option value="research">Research</option>
                <option value="nft">NFT</option>
                <option value="security">Security</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Execution Mode</label>
              <select value={form.executionMode} onChange={update('executionMode')} className={inputCls}>
                <option value="once">Single Run</option>
                <option value="stream">Streaming</option>
              </select>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className={labelCls}>System Prompt *</label>
            <textarea value={form.systemPrompt} onChange={update('systemPrompt')} required rows={4}
              placeholder="You are a DeFi analyst. Analyze pool data and provide clear, actionable insights..."
              className={`${inputCls} resize-none font-mono text-sm`} />
          </div>

          {/* User Prompt Template */}
          <div>
            <label className={labelCls}>
              User Prompt Template
              <span className="text-[#555] ml-2">Use {'{{variable}}'} for user inputs</span>
            </label>
            <textarea value={form.userPromptTemplate} onChange={update('userPromptTemplate')} rows={3}
              placeholder="Analyze the pool at {{address}} on {{chain}} for the last {{timeRange}}"
              onBlur={detectVariables}
              className={`${inputCls} resize-none font-mono text-sm`} />
          </div>

          {/* Input Fields */}
          <div>
            <label className={labelCls}>Input Fields</label>
            <div className="space-y-2">
              {inputFields.map((field, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={field.name}
                    onChange={e => updateField(i, 'name', e.target.value)}
                    placeholder="field name"
                    className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-sm font-mono placeholder-[#444] focus:border-[#00d4aa] outline-none"
                  />
                  <select
                    value={field.type}
                    onChange={e => updateField(i, 'type', e.target.value)}
                    className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:border-[#00d4aa] outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="select">Select</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs text-[#888]">
                    <input
                      type="checkbox" checked={field.required}
                      onChange={e => updateField(i, 'required', e.target.checked)}
                      className="accent-[#00d4aa]"
                    />
                    Required
                  </label>
                  <button type="button" onClick={() => removeField(i)}
                    className="text-[#666] hover:text-red-400 text-sm px-2">
                    &times;
                  </button>
                </div>
              ))}
              <button type="button" onClick={addInputField}
                className="text-sm text-[#00d4aa] hover:text-[#00b894] transition-colors">
                + Add Field
              </button>
            </div>
          </div>

          {/* Model + Temperature + Max Tokens */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Model</label>
              <select value={form.model} onChange={update('model')} className={inputCls}>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-2.5-pro-exp-03-25">Gemini 2.5 Pro</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Temperature</label>
              <input type="number" value={form.temperature} onChange={update('temperature')}
                min="0" max="2" step="0.1" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Max Tokens</label>
              <input type="number" value={form.maxTokens} onChange={update('maxTokens')}
                min="128" max="8192" step="128" className={inputCls} />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className={labelCls}>
              Price per Run (USDC micro-units) — {priceInUSDC} USDC/run
            </label>
            <input type="number" value={form.pricePerRun} onChange={update('pricePerRun')}
              min="0" step="1000" className={inputCls} />
            <p className="text-xs text-[#555] mt-1">Set to 0 for free skills.</p>
          </div>

          {/* Metadata URI */}
          <div>
            <label className={labelCls}>External Link (optional)</label>
            <input type="url" value={form.metadataUri} onChange={update('metadataUri')}
              placeholder="https://github.com/..." className={`${inputCls} font-mono text-sm`} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading || !address}
            className="w-full bg-[#00d4aa] text-black font-bold py-3.5 rounded-xl hover:bg-[#00b894] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Publishing...' : !address ? 'Connect Wallet First' : 'Publish Skill'}
          </button>
        </form>
      </div>
    </div>
  )
}
