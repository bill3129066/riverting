'use client'
import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useRouter } from 'next/navigation'
import { createAgent, compressContent } from '@/lib/agents-api'
import { signAction } from '@/lib/sign-action'

/**
 * Parse SKILL.md frontmatter format
 */
function parseSkillMd(content: string): { name: string; description: string; systemPrompt: string } | null {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)/)
  if (!fmMatch) return null

  const frontmatter = fmMatch[1]
  const body = fmMatch[2].trim()

  const nameMatch = frontmatter.match(/name:\s*(.+)/)
  const descMatch = frontmatter.match(/description:\s*(.+)/)

  return {
    name: nameMatch?.[1]?.trim() || 'Unnamed Agent',
    description: descMatch?.[1]?.trim() || '',
    systemPrompt: body.slice(0, 8000),
  }
}

export default function UploadAgentPage() {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'manual' | 'import'>('manual')

  // Manual form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'general',
    systemPrompt: '',
    userPromptTemplate: '',
    model: 'gemini-2.5-flash',
    temperature: '0.3',
    maxTokens: '1024',
    ratePerSecond: '0',
    metadataUri: '',
  })
  const [inputFields, setInputFields] = useState<{ name: string; type: string; required: boolean }[]>([])

  // Import state
  const [skillMdContent, setSkillMdContent] = useState('')
  const [patternFiles, setPatternFiles] = useState<{ name: string; content: string }[]>([])
  const [importPreview, setImportPreview] = useState<{ name: string; description: string; patterns: string[] } | null>(null)
  const [importCategory, setImportCategory] = useState('defi')
  const [importPrice, setImportPrice] = useState('100')
  const [autoCompress, setAutoCompress] = useState(true)
  const [compressStatus, setCompressStatus] = useState('')

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

  const detectVariables = () => {
    const matches = form.userPromptTemplate.match(/\{\{(\w+)\}\}/g)
    if (!matches) return
    const vars = [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
    const existing = new Set(inputFields.map(f => f.name))
    const newFields = vars.filter(v => !existing.has(v)).map(v => ({ name: v, type: 'text', required: true }))
    if (newFields.length > 0) setInputFields(prev => [...prev, ...newFields])
  }

  const processImportedContent = (content: string, pFiles: { name: string; content: string }[]) => {
    setSkillMdContent(content)
    const parsed = parseSkillMd(content)
    if (parsed) {
      setImportPreview({
        name: parsed.name,
        description: parsed.description,
        patterns: pFiles.map(p => p.name),
      })
    } else {
      setImportPreview(null)
    }
  }

  // Handle Directory Upload
  const handleDirectoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    let masterContent = ''
    const newPatterns: { name: string; content: string }[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.name === 'SKILL.md') {
        masterContent = await file.text()
      } else if (file.webkitRelativePath.includes('/patterns/') && file.name.endsWith('.md')) {
        const content = await file.text()
        newPatterns.push({ name: file.name.replace('.md', ''), content })
      } else if (file.name.endsWith('.md') && file.name !== 'README.md') {
        // Fallback if not inside a strict "patterns/" folder but uploaded together
        const content = await file.text()
        newPatterns.push({ name: file.name.replace('.md', ''), content })
      }
    }
    
    setPatternFiles(newPatterns)
    if (masterContent) {
      processImportedContent(masterContent, newPatterns)
    } else {
      setError('Directory must contain a SKILL.md file at its root.')
    }
  }

  // Submit manual form
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) { setError('Connect wallet first'); return }
    if (!form.name || !form.description || !form.systemPrompt) {
      setError('Name, description, and system prompt are required'); return
    }
    setLoading(true)
    setError('')

    try {
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

      // Auto-compress
      let systemPrompt = form.systemPrompt
      if (autoCompress && systemPrompt.length > 3000) {
        setCompressStatus('Compressing system prompt...')
        const result = await compressContent(systemPrompt, 'skill')
        systemPrompt = result.content
        setCompressStatus(`Compression: ${result.original}B -> ${result.compressed}B (${result.ratio})`)
      }

      const auth = await signAction(signMessageAsync, address, 'create-agent')
      const created = await createAgent({
        name: form.name,
        description: form.description,
        category: form.category,
        systemPrompt,
        rawSystemPrompt: systemPrompt !== form.systemPrompt ? form.systemPrompt : undefined,
        userPromptTemplate: form.userPromptTemplate || undefined,
        model: form.model,
        temperature: parseFloat(form.temperature),
        maxTokens: parseInt(form.maxTokens),
        ratePerSecond: parseInt(form.ratePerSecond),
        metadataUri: form.metadataUri || undefined,
        inputSchemaJson,
      }, auth)

      router.push(`/agents/${created.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Submit import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) { setError('Connect wallet first'); return }

    const parsed = parseSkillMd(skillMdContent)
    if (!parsed) { setError('Invalid SKILL.md format. Must have --- frontmatter ---'); return }

    setLoading(true)
    setError('')
    setCompressStatus('')

    try {
      // Auto-compress if enabled
      let masterPrompt = parsed.systemPrompt
      const processedPatterns = [...patternFiles]

      if (autoCompress && masterPrompt.length > 3000) {
        setCompressStatus('Compressing SKILL.md...')
        const result = await compressContent(masterPrompt, 'skill')
        masterPrompt = result.content
        setCompressStatus(`SKILL.md: ${result.original}B -> ${result.compressed}B (${result.ratio})`)

        for (let i = 0; i < processedPatterns.length; i++) {
          if (processedPatterns[i].content.length > 2000) {
            setCompressStatus(`Compressing ${processedPatterns[i].name}...`)
            const pr = await compressContent(processedPatterns[i].content, 'pattern')
            processedPatterns[i] = { ...processedPatterns[i], content: pr.content }
          }
        }
        setCompressStatus('Compression complete. Deploying...')
      }

      const auth = await signAction(signMessageAsync, address, 'create-agent')
      let createdAgentId = ''

      // Create master agent from SKILL.md
      const created = await createAgent({
        name: parsed.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: parsed.description,
        category: importCategory,
        systemPrompt: masterPrompt,
        rawSystemPrompt: parsed.systemPrompt,
        userPromptTemplate: 'Analyze: {{query}}\n\nChain: {{chain}}\nTarget address (if any): {{address}}',
        model: 'gemini-2.5-flash',
        temperature: 0.2,
        maxTokens: 2048,
        ratePerSecond: parseInt(importPrice),
        metadataUri: form.metadataUri || undefined,
        inputSchemaJson: JSON.stringify({
          type: 'object',
          properties: { query: { type: 'string' }, chain: { type: 'string' }, address: { type: 'string' } },
          required: ['query'],
        }),
      }, auth)
      createdAgentId = created.id

      // Create individual pattern agents
      for (let i = 0; i < processedPatterns.length; i++) {
        const pattern = processedPatterns[i]
        const originalPattern = patternFiles[i]
        const patternAuth = await signAction(signMessageAsync, address, 'create-agent')
        const patternName = pattern.name
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())

        await createAgent({
          name: patternName,
          description: `${patternName} — sub-agent from ${parsed.name}`,
          category: importCategory,
          systemPrompt: pattern.content.slice(0, 8000),
          rawSystemPrompt: originalPattern?.content,
          userPromptTemplate: '{{query}}\n\nTarget: {{address}}\nChain: {{chain}}',
          model: 'gemini-2.5-flash',
          temperature: 0.2,
          maxTokens: 2048,
          ratePerSecond: parseInt(importPrice),
          inputSchemaJson: JSON.stringify({
            type: 'object',
            properties: { query: { type: 'string' }, address: { type: 'string' }, chain: { type: 'string' } },
            required: ['query'],
          }),
        }, patternAuth)
      }

      router.push(`/agents/${createdAgentId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-zinc-950 border-2 border-cyan-900/50 focus:border-cyan-400 rounded-none px-4 py-3 text-cyan-100 placeholder-cyan-900 focus:ring-1 focus:ring-cyan-400/30 outline-none font-mono text-sm transition-all shadow-inner shadow-cyan-900/10'
  const labelCls = 'block text-xs font-mono text-cyan-500 uppercase tracking-widest mb-2 flex items-center gap-2'

  return (
    <div className="min-h-screen bg-black text-cyan-50 p-8 font-sans selection:bg-fuchsia-500/30">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 border-b-2 border-cyan-500/30 pb-4 relative">
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/50" />
          <h1 className="text-4xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 drop-shadow-md">
            Initialize_Agent
          </h1>
          <p className="text-cyan-600 font-mono text-sm mt-2 uppercase tracking-wide">
            [Deploy new autonomous construct into the mainframe]
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => setMode('manual')}
            className={`px-6 py-2 text-sm font-mono uppercase tracking-wider transition-all border-2 ${
              mode === 'manual' 
                ? 'bg-cyan-950/50 text-cyan-300 border-cyan-400 shadow-lg shadow-cyan-500/20' 
                : 'bg-black text-cyan-800 border-cyan-900 hover:border-cyan-700'
            }`}>
            [Manual_Config]
          </button>
          <button onClick={() => setMode('import')}
            className={`px-6 py-2 text-sm font-mono uppercase tracking-wider transition-all border-2 ${
              mode === 'import' 
                ? 'bg-fuchsia-950/50 text-fuchsia-300 border-fuchsia-400 shadow-lg shadow-fuchsia-500/20' 
                : 'bg-black text-cyan-800 border-cyan-900 hover:border-cyan-700'
            }`}>
            [Import_Directory]
          </button>
        </div>

        {mode === 'import' ? (
          /* ===== IMPORT MODE ===== */
          <form onSubmit={handleImportSubmit} className="space-y-6 relative border-l-2 border-fuchsia-500/30 pl-6">
            <div className="absolute top-0 -left-[1.1rem] text-fuchsia-500 bg-black py-2">&gt;</div>

            {/* Directory Upload */}
            <div className="group border border-fuchsia-500/30 p-6 bg-zinc-950 relative overflow-hidden text-center hover:border-fuchsia-500 transition-colors">
              <div className="absolute inset-0 bg-fuchsia-500/5 bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.1)_0,transparent_100%)] pointer-events-none" />
              <label className="block cursor-pointer relative z-10">
                <div className="w-16 h-16 mx-auto border-2 border-dashed border-fuchsia-500/50 rounded-full flex items-center justify-center text-fuchsia-500 mb-4 group-hover:bg-fuchsia-500/20 transition-all">
                  <span className="text-2xl font-black">DIR</span>
                </div>
                <h3 className="text-fuchsia-400 font-mono font-bold uppercase tracking-widest mb-2">Upload Skill Directory</h3>
                <p className="text-xs text-fuchsia-800/80 font-mono">
                  Auto-parses SKILL.md and multiple sub-agents from patterns/*.md
                </p>
                {/* @ts-ignore */}
                <input type="file" webkitdirectory="" directory="" onChange={handleDirectoryUpload} className="hidden" />
              </label>
            </div>

            {/* Preview */}
            {importPreview && (
              <div className="bg-zinc-950 border border-fuchsia-500/30 p-5 relative overflow-hidden mt-6">
                <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 blur-3xl rounded-full" />
                <h3 className="text-sm font-mono font-bold text-fuchsia-400 mb-3 tracking-widest uppercase flex items-center gap-2">
                  <span className="w-2 h-2 bg-fuchsia-500 inline-block animate-pulse" />
                  Target_Preview
                </h3>
                <p className="text-base text-cyan-50 mb-1 font-bold">{importPreview.name}</p>
                <p className="text-sm text-cyan-600 mb-4 line-clamp-2">{importPreview.description}</p>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-1 bg-fuchsia-500/20 text-fuchsia-300">1 Core</span>
                  {importPreview.patterns.length > 0 && (
                    <>
                      <span className="text-cyan-800">+</span>
                      <span className="px-2 py-1 bg-cyan-900/50 text-cyan-300">{importPreview.patterns.length} Sub-agents</span>
                    </>
                  )}
                  <span className="text-cyan-800">=</span>
                  <span className="text-white font-bold">{1 + importPreview.patterns.length} Total</span>
                </div>
              </div>
            )}

            {/* Auto-compress toggle */}
            <div className="flex items-center gap-3 py-2 mt-4">
              <label className="flex items-center gap-3 text-sm font-mono text-cyan-500 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={autoCompress} onChange={e => setAutoCompress(e.target.checked)}
                    className="sr-only peer" />
                  <div className="w-8 h-4 bg-zinc-800 border border-cyan-900 peer-checked:bg-fuchsia-500/30 peer-checked:border-fuchsia-500 transition-all"></div>
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-cyan-800 peer-checked:bg-fuchsia-400 peer-checked:translate-x-4 transition-all"></div>
                </div>
                ENABLE_PROMPT_COMPRESSION
              </label>
              {compressStatus && (
                <span className="text-xs font-mono text-fuchsia-400 bg-fuchsia-950/50 border border-fuchsia-900/50 px-3 py-1.5 shadow-sm">
                  {compressStatus}
                </span>
              )}
            </div>

            {/* Category + Price */}
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <label className={labelCls}>Classification</label>
                <select value={importCategory} onChange={e => setImportCategory(e.target.value)} className={inputCls}>
                  <option value="general">General</option>
                  <option value="defi">DeFi</option>
                  <option value="trading">Trading</option>
                  <option value="research">Research</option>
                  <option value="nft">NFT</option>
                  <option value="security">Security</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Cycle_Cost (rate/s)</label>
                <input type="number" value={importPrice} onChange={e => setImportPrice(e.target.value)}
                  min="0" step="1" className={inputCls} />
              </div>
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-500/50 text-red-400 p-3 text-sm font-mono uppercase mt-4">
                ERR: {error}
              </div>
            )}

            <button type="submit" disabled={loading || !address || !skillMdContent}
              className="w-full mt-6 bg-fuchsia-600 text-white font-black font-mono tracking-widest py-4 uppercase hover:bg-fuchsia-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-fuchsia-400 shadow-lg shadow-fuchsia-500/40 hover:shadow-fuchsia-500/60 hover:-translate-y-0.5">
              {loading ? '[Executing_Deployment...]' : !address ? '[Require_Wallet_Link]' : `[Initialize_Batch (${importPreview ? 1 + patternFiles.length : 0})]`}
            </button>
          </form>
        ) : (
          /* ===== MANUAL MODE ===== */
          <form onSubmit={handleManualSubmit} className="space-y-6 relative border-l-2 border-cyan-500/30 pl-6">
            <div className="absolute top-0 -left-[1.1rem] text-cyan-500 bg-black py-2">&gt;</div>

            <div>
              <label className={labelCls}>Designation *</label>
              <input value={form.name} onChange={update('name')} required placeholder="e.g. DATA_SCRAPER_V1" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Directive_Summary *</label>
              <textarea value={form.description} onChange={update('description')} required rows={2}
                placeholder="Primary function of this construct..." className={`${inputCls} resize-none`} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Classification</label>
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
                <label className={labelCls}>Engine_Core</label>
                <select value={form.model} onChange={update('model')} className={inputCls}>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>System_Prompt *</label>
              <textarea value={form.systemPrompt} onChange={update('systemPrompt')} required rows={5}
                placeholder="You are an autonomous agent deployed to..."
                className={`${inputCls} resize-none`} />
            </div>

            <div className="bg-cyan-950/20 border border-cyan-900/50 p-4 relative">
              <label className={labelCls}>
                User_Prompt_Template
              </label>
              <p className="text-xs text-cyan-600 font-mono mb-3">Syntax: {'{{variable}}'} auto-generates input fields</p>
              <textarea value={form.userPromptTemplate} onChange={update('userPromptTemplate')} rows={3}
                placeholder="Analyze {{target}} using {{parameters}}"
                onBlur={detectVariables}
                className={`${inputCls} resize-none bg-black/50`} />
            </div>

            <div>
              <label className={labelCls}>Schema_Parameters</label>
              <div className="space-y-3">
                {inputFields.map((field, i) => (
                  <div key={i} className="flex gap-3 items-center bg-zinc-950 p-2 border border-cyan-900/30">
                    <input value={field.name} onChange={e => updateField(i, 'name', e.target.value)}
                      placeholder="var_name"
                      className="flex-1 bg-black border-b border-cyan-900 px-3 py-2 text-cyan-100 text-sm font-mono placeholder-cyan-900 focus:border-cyan-400 outline-none" />
                    <select value={field.type} onChange={e => updateField(i, 'type', e.target.value)}
                      className="bg-black border-b border-cyan-900 px-3 py-2 text-cyan-100 text-sm font-mono focus:border-cyan-400 outline-none">
                      <option value="text">STRING</option>
                      <option value="number">NUMBER</option>
                      <option value="select">SELECT</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs font-mono text-cyan-600 uppercase">
                      <input type="checkbox" checked={field.required}
                        onChange={e => updateField(i, 'required', e.target.checked)} 
                        className="bg-black border border-cyan-900 checked:bg-cyan-500 rounded-none w-4 h-4 appearance-none checked:after:content-['\2713'] checked:after:text-black checked:after:absolute checked:after:text-[10px] checked:after:font-bold relative flex items-center justify-center" />
                      Req
                    </label>
                    <button type="button" onClick={() => removeField(i)}
                      className="text-cyan-800 hover:text-red-500 text-sm px-2 font-black transition-colors">&times;</button>
                  </div>
                ))}
                <button type="button" onClick={addInputField}
                  className="text-xs font-mono text-cyan-400 border border-cyan-500/30 px-3 py-1 hover:bg-cyan-500/10 transition-colors">
                  [+] ADD_PARAM
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelCls}>Temp_Variance: {form.temperature}</label>
                <div className="relative pt-1 flex items-center">
                  <input type="range" value={form.temperature} onChange={update('temperature')}
                    min="0" max="2" step="0.1" 
                    className="w-full h-1 bg-cyan-900/50 appearance-none rounded-none accent-cyan-400 hover:accent-cyan-300 cursor-pointer outline-none" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Max_Tokens</label>
                <input type="number" value={form.maxTokens} onChange={update('maxTokens')}
                  min="128" max="8192" step="128" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cycle_Cost (rate/s)</label>
                <input type="number" value={form.ratePerSecond} onChange={update('ratePerSecond')}
                  min="0" step="1" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Metadata_Link (URI)</label>
              <input type="url" value={form.metadataUri} onChange={update('metadataUri')}
                placeholder="https://github.com/..." className={inputCls} />
            </div>

            <div className="flex items-center gap-3 py-2">
              <label className="flex items-center gap-3 text-sm font-mono text-cyan-500 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={autoCompress} onChange={e => setAutoCompress(e.target.checked)}
                    className="sr-only peer" />
                  <div className="w-8 h-4 bg-zinc-800 border border-cyan-900 peer-checked:bg-cyan-500/30 peer-checked:border-cyan-500 transition-all"></div>
                  <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-cyan-800 peer-checked:bg-cyan-400 peer-checked:translate-x-4 transition-all"></div>
                </div>
                ENABLE_PROMPT_COMPRESSION
              </label>
              {compressStatus && (
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-900/50 px-3 py-1.5 shadow-sm">
                  {compressStatus}
                </span>
              )}
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-500/50 text-red-400 p-3 text-sm font-mono uppercase">
                ERR: {error}
              </div>
            )}

            <button type="submit" disabled={loading || !address}
              className="w-full bg-cyan-600 text-black font-black font-mono tracking-widest py-4 uppercase hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-cyan-300 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:-translate-y-0.5">
              {loading ? '[Executing_Deployment...]' : !address ? '[Require_Wallet_Link]' : '[Deploy_Construct]'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
