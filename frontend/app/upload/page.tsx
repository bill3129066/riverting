'use client'
import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useRouter } from 'next/navigation'
import { createSkill, compressSkillContent } from '@/lib/skills-api'
import { signAction } from '@/lib/sign-action'

/**
 * Parse SKILL.md frontmatter format:
 * ---
 * name: skill-name
 * description: ...
 * ---
 * (markdown body = system prompt)
 */
function parseSkillMd(content: string): { name: string; description: string; systemPrompt: string } | null {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)/)
  if (!fmMatch) return null

  const frontmatter = fmMatch[1]
  const body = fmMatch[2].trim()

  const nameMatch = frontmatter.match(/name:\s*(.+)/)
  const descMatch = frontmatter.match(/description:\s*(.+)/)

  return {
    name: nameMatch?.[1]?.trim() || 'Unnamed Skill',
    description: descMatch?.[1]?.trim() || '',
    systemPrompt: body.slice(0, 8000),
  }
}

export default function UploadSkillPage() {
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
    pricePerRun: '0',
    executionMode: 'once',
    metadataUri: '',
  })
  const [inputFields, setInputFields] = useState<{ name: string; type: string; required: boolean }[]>([])

  // Import state
  const [skillMdContent, setSkillMdContent] = useState('')
  const [patternFiles, setPatternFiles] = useState<{ name: string; content: string }[]>([])
  const [importPreview, setImportPreview] = useState<{ name: string; description: string; patterns: string[] } | null>(null)
  const [importCategory, setImportCategory] = useState('defi')
  const [importPrice, setImportPrice] = useState('3000')
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

  const handleSkillMdChange = (content: string) => {
    setSkillMdContent(content)
    const parsed = parseSkillMd(content)
    if (parsed) {
      setImportPreview({
        name: parsed.name,
        description: parsed.description,
        patterns: patternFiles.map(p => p.name),
      })
    } else {
      setImportPreview(null)
    }
  }

  const handlePatternUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newPatterns: { name: string; content: string }[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.name.endsWith('.md')) {
        const content = await file.text()
        newPatterns.push({ name: file.name.replace('.md', ''), content })
      }
    }
    setPatternFiles(prev => {
      const updated = [...prev, ...newPatterns]
      if (importPreview) {
        setImportPreview({ ...importPreview, patterns: updated.map(p => p.name) })
      }
      return updated
    })
  }

  const removePattern = (index: number) => {
    setPatternFiles(prev => {
      const updated = prev.filter((_, i) => i !== index)
      if (importPreview) setImportPreview({ ...importPreview, patterns: updated.map(p => p.name) })
      return updated
    })
  }

  const handleSkillMdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const content = await file.text()
    setSkillMdContent(content)
    handleSkillMdChange(content)
  }

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

      let systemPrompt = form.systemPrompt
      if (autoCompress && systemPrompt.length > 3000) {
        setCompressStatus('Compressing system prompt...')
        const result = await compressSkillContent(systemPrompt, 'skill')
        systemPrompt = result.content
        setCompressStatus(`Compressed ${result.ratio}`)
      }

      const auth = await signAction(signMessageAsync, address, 'create-skill')
      await createSkill({
        name: form.name,
        description: form.description,
        category: form.category,
        systemPrompt,
        rawSystemPrompt: systemPrompt !== form.systemPrompt ? form.systemPrompt : undefined,
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

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) { setError('Connect wallet first'); return }

    const parsed = parseSkillMd(skillMdContent)
    if (!parsed) { setError('Invalid SKILL.md format. Must have --- frontmatter ---'); return }

    setLoading(true)
    setError('')
    setCompressStatus('')

    try {
      let masterPrompt = parsed.systemPrompt
      const processedPatterns = [...patternFiles]

      if (autoCompress && masterPrompt.length > 3000) {
        setCompressStatus('Compressing SKILL.md...')
        const result = await compressSkillContent(masterPrompt, 'skill')
        masterPrompt = result.content
        setCompressStatus(`SKILL.md compressed ${result.ratio}`)

        for (let i = 0; i < processedPatterns.length; i++) {
          if (processedPatterns[i].content.length > 2000) {
            setCompressStatus(`Compressing ${processedPatterns[i].name}...`)
            const pr = await compressSkillContent(processedPatterns[i].content, 'pattern')
            processedPatterns[i] = { ...processedPatterns[i], content: pr.content }
          }
        }
        setCompressStatus('Compression done. Publishing...')
      }

      const auth = await signAction(signMessageAsync, address, 'create-skill')
      let created = 0

      await createSkill({
        name: parsed.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: parsed.description,
        category: importCategory,
        systemPrompt: masterPrompt,
        rawSystemPrompt: parsed.systemPrompt,
        userPromptTemplate: 'Analyze: {{query}}\n\nChain: {{chain}}\nTarget address (if any): {{address}}',
        model: 'gemini-2.5-flash',
        temperature: 0.2,
        maxTokens: 2048,
        pricePerRun: parseInt(importPrice),
        executionMode: 'stream',
        metadataUri: form.metadataUri || undefined,
        inputSchemaJson: JSON.stringify({
          type: 'object',
          properties: { query: { type: 'string' }, chain: { type: 'string' }, address: { type: 'string' } },
          required: ['query'],
        }),
      }, auth)
      created++

      for (let i = 0; i < processedPatterns.length; i++) {
        const pattern = processedPatterns[i]
        const originalPattern = patternFiles[i]
        const patternAuth = await signAction(signMessageAsync, address, 'create-skill')
        const patternName = pattern.name
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())

        await createSkill({
          name: patternName,
          description: `${patternName} — sub-skill from ${parsed.name}`,
          category: importCategory,
          systemPrompt: pattern.content.slice(0, 8000),
          rawSystemPrompt: originalPattern?.content,
          userPromptTemplate: '{{query}}\n\nTarget: {{address}}\nChain: {{chain}}',
          model: 'gemini-2.5-flash',
          temperature: 0.2,
          maxTokens: 2048,
          pricePerRun: parseInt(importPrice),
          executionMode: 'once',
          inputSchemaJson: JSON.stringify({
            type: 'object',
            properties: { query: { type: 'string' }, address: { type: 'string' }, chain: { type: 'string' } },
            required: ['query'],
          }),
        }, patternAuth)
        created++
      }

      router.push('/skills')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-surface-dim border border-border-subtle px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-accent outline-none transition-colors'
  const labelCls = 'block text-xs text-text-secondary uppercase tracking-widest mb-2'

  return (
    <div className="bg-background min-h-screen text-text-primary">
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-24 pt-24 pb-32">
        <h1 className="font-display font-bold text-[5rem] leading-[0.95] tracking-tight mb-6">Upload New Skill</h1>
        <p className="text-text-secondary text-lg mb-16 max-w-2xl">Define a reusable AI skill that anyone can execute.</p>

        <div className="max-w-2xl">
          {/* Mode Toggle */}
          <div className="flex gap-8 mb-12 border-b border-border-subtle">
            <button onClick={() => setMode('manual')}
              className={`pb-3 text-xs uppercase tracking-widest font-bold transition-colors ${
                mode === 'manual' ? 'text-text-primary border-b-2 border-text-primary' : 'text-text-tertiary hover:text-text-primary'
              }`}>
              Manual Form
            </button>
            <button onClick={() => setMode('import')}
              className={`pb-3 text-xs uppercase tracking-widest font-bold transition-colors ${
                mode === 'import' ? 'text-text-primary border-b-2 border-text-primary' : 'text-text-tertiary hover:text-text-primary'
              }`}>
              Import SKILL.md
            </button>
          </div>

          {mode === 'import' ? (
            /* ===== IMPORT MODE ===== */
            <form onSubmit={handleImportSubmit} className="space-y-8">
              {/* SKILL.md */}
              <div>
                <label className={labelCls}>SKILL.md *</label>
                <p className="text-xs text-text-tertiary mb-3">
                  Upload or paste a SKILL.md file with frontmatter (--- name / description ---) and markdown body.
                </p>
                <div className="flex gap-2 mb-3">
                  <label className="group cursor-pointer inline-flex items-center gap-2 border-b border-accent pb-1 text-sm font-medium text-accent transition-colors hover:text-accent-muted">
                    Upload File
                    <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">upload_file</span>
                    <input type="file" accept=".md" onChange={handleSkillMdUpload} className="hidden" />
                  </label>
                </div>
                <textarea
                  value={skillMdContent}
                  onChange={e => handleSkillMdChange(e.target.value)}
                  rows={8}
                  placeholder={"---\nname: my-skill\ndescription: What this skill does...\n---\n\n# Skill Instructions\n\nYour system prompt here..."}
                  className={`${inputCls} resize-none font-mono text-sm`}
                />
              </div>

              {/* Pattern Files */}
              <div>
                <label className={labelCls}>Pattern Files (optional)</label>
                <p className="text-xs text-text-tertiary mb-3">
                  Upload .md files from the patterns/ directory. Each becomes a separate sub-skill.
                </p>
                <label className="group cursor-pointer inline-flex items-center gap-2 border-b border-accent pb-1 text-sm font-medium text-accent transition-colors hover:text-accent-muted mb-4">
                  + Upload Pattern Files
                  <input type="file" accept=".md" multiple onChange={handlePatternUpload} className="hidden" />
                </label>
                {patternFiles.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {patternFiles.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 bg-surface-dim border border-border-subtle px-4 py-3">
                        <span className="text-sm text-text-primary flex-1 font-mono">{p.name}.md</span>
                        <span className="text-xs text-text-tertiary">{(p.content.length / 1024).toFixed(1)}KB</span>
                        <button type="button" onClick={() => removePattern(i)}
                          className="text-text-tertiary hover:text-error text-sm transition-colors">&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview */}
              {importPreview && (
                <div className="border border-accent/30 bg-surface-elevated p-6">
                  <h3 className="text-xs uppercase tracking-widest text-accent font-bold mb-4">Preview</h3>
                  <p className="font-display text-xl font-bold text-text-primary mb-1">{importPreview.name}</p>
                  <p className="text-sm text-text-secondary mb-4 line-clamp-2">{importPreview.description}</p>
                  <p className="text-xs text-text-tertiary">
                    Will create: <span className="text-text-primary font-bold">1 master skill</span>
                    {importPreview.patterns.length > 0 && (
                      <span> + <span className="text-text-primary font-bold">{importPreview.patterns.length} pattern skills</span></span>
                    )}
                    {' '}= <span className="text-accent font-bold">{1 + importPreview.patterns.length} total</span>
                  </p>
                </div>
              )}

              {/* Auto-compress toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input type="checkbox" checked={autoCompress} onChange={e => setAutoCompress(e.target.checked)}
                    className="accent-accent" />
                  Auto-compress prompts (recommended for large skills)
                </label>
                {compressStatus && (
                  <span className="text-xs text-accent">{compressStatus}</span>
                )}
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={importCategory} onChange={e => setImportCategory(e.target.value)} className={`${inputCls} appearance-none`}>
                    <option value="general">General</option>
                    <option value="defi">DeFi</option>
                    <option value="trading">Trading</option>
                    <option value="research">Research</option>
                    <option value="nft">NFT</option>
                    <option value="security">Security</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Price per Run (micro-USDC)</label>
                  <input type="number" value={importPrice} onChange={e => setImportPrice(e.target.value)}
                    min="0" step="1000" className={inputCls} />
                </div>
              </div>

              {error && <p className="text-error text-sm font-mono">{error}</p>}

              <button type="submit" disabled={loading || !address || !skillMdContent}
                className="w-full bg-text-primary text-surface-elevated font-bold py-4 uppercase tracking-widest text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Importing...' : !address ? 'Connect Wallet First' : `Import ${importPreview ? `(${1 + patternFiles.length} skills)` : 'Skill'} →`}
              </button>
            </form>
          ) : (
            /* ===== MANUAL MODE ===== */
            <form onSubmit={handleManualSubmit} className="space-y-8">
              <div>
                <label htmlFor="skill-name" className={labelCls}>Skill Name *</label>
                <input id="skill-name" value={form.name} onChange={update('name')} required placeholder="e.g. DeFi Pool Analyzer" className={inputCls} />
              </div>

              <div>
                <label htmlFor="skill-desc" className={labelCls}>Description *</label>
                <textarea id="skill-desc" value={form.description} onChange={update('description')} required rows={2}
                  placeholder="What does this skill do?" className={`${inputCls} resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label htmlFor="skill-cat" className={labelCls}>Category</label>
                  <select id="skill-cat" value={form.category} onChange={update('category')} className={`${inputCls} appearance-none`}>
                    <option value="general">General</option>
                    <option value="defi">DeFi</option>
                    <option value="trading">Trading</option>
                    <option value="research">Research</option>
                    <option value="nft">NFT</option>
                    <option value="security">Security</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="skill-exec" className={labelCls}>Execution Mode</label>
                  <select id="skill-exec" value={form.executionMode} onChange={update('executionMode')} className={`${inputCls} appearance-none`}>
                    <option value="once">Single Run</option>
                    <option value="stream">Streaming</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="skill-prompt" className={labelCls}>System Prompt *</label>
                <textarea id="skill-prompt" value={form.systemPrompt} onChange={update('systemPrompt')} required rows={4}
                  placeholder="You are a DeFi analyst. Analyze pool data and provide clear, actionable insights..."
                  className={`${inputCls} resize-none font-mono text-sm`} />
              </div>

              <div>
                <label htmlFor="skill-tpl" className={labelCls}>
                  User Prompt Template
                  <span className="text-text-tertiary ml-2 normal-case tracking-normal">Use {'{{variable}}'} for user inputs</span>
                </label>
                <textarea id="skill-tpl" value={form.userPromptTemplate} onChange={update('userPromptTemplate')} rows={3}
                  placeholder="Analyze the pool at {{address}} on {{chain}} for the last {{timeRange}}"
                  onBlur={detectVariables}
                  className={`${inputCls} resize-none font-mono text-sm`} />
              </div>

              <div>
                <label className={labelCls}>Input Fields</label>
                <div className="space-y-3">
                  {inputFields.map((field, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input value={field.name} onChange={e => updateField(i, 'name', e.target.value)}
                        placeholder="field name"
                        className="flex-1 bg-surface-dim border border-border-subtle px-3 py-2 text-text-primary text-sm font-mono placeholder:text-text-tertiary focus:border-accent outline-none transition-colors" />
                      <select value={field.type} onChange={e => updateField(i, 'type', e.target.value)}
                        className="bg-surface-dim border border-border-subtle px-3 py-2 text-text-primary text-sm focus:border-accent outline-none transition-colors appearance-none">
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="select">Select</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                        <input type="checkbox" checked={field.required}
                          onChange={e => updateField(i, 'required', e.target.checked)} className="accent-accent" />
                        Required
                      </label>
                      <button type="button" onClick={() => removeField(i)}
                        className="text-text-tertiary hover:text-error text-sm px-2 transition-colors">&times;</button>
                    </div>
                  ))}
                  <button type="button" onClick={addInputField}
                    className="group inline-flex items-center gap-2 border-b border-accent pb-1 text-sm font-medium text-accent transition-colors hover:text-accent-muted">
                    + Add Field
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div>
                  <label htmlFor="skill-model" className={labelCls}>Model</label>
                  <select id="skill-model" value={form.model} onChange={update('model')} className={`${inputCls} appearance-none`}>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="skill-temp" className={labelCls}>Temperature</label>
                  <input id="skill-temp" type="number" value={form.temperature} onChange={update('temperature')}
                    min="0" max="2" step="0.1" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="skill-tokens" className={labelCls}>Max Tokens</label>
                  <input id="skill-tokens" type="number" value={form.maxTokens} onChange={update('maxTokens')}
                    min="128" max="8192" step="128" className={inputCls} />
                </div>
              </div>

              <div>
                <label htmlFor="skill-price" className={labelCls}>
                  Price per Run (USDC micro-units) — <span className="text-accent normal-case tracking-normal">{(parseInt(form.pricePerRun || '0') / 1_000_000).toFixed(6)} USDC/run</span>
                </label>
                <input id="skill-price" type="number" value={form.pricePerRun} onChange={update('pricePerRun')}
                  min="0" step="1000" className={inputCls} />
                <p className="text-xs text-text-tertiary mt-2">Set to 0 for free skills.</p>
              </div>

              <div>
                <label htmlFor="skill-link" className={labelCls}>External Link (optional)</label>
                <input id="skill-link" type="url" value={form.metadataUri} onChange={update('metadataUri')}
                  placeholder="https://github.com/..." className={`${inputCls} font-mono text-sm`} />
              </div>

              {error && <p className="text-error text-sm font-mono">{error}</p>}

              <button type="submit" disabled={loading || !address}
                className="w-full bg-text-primary text-surface-elevated font-bold py-4 uppercase tracking-widest text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Publishing...' : !address ? 'Connect Wallet First' : 'Publish Skill →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
