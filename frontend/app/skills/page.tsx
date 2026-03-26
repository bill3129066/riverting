'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAccount, useSignMessage } from 'wagmi'
import { fetchSkills, deleteSkill } from '@/lib/skills-api'
import { signAction } from '@/lib/sign-action'

interface Skill {
  id: string
  name: string
  description: string
  category: string
  execution_mode: string
  price_per_run: number
  run_count: number
  avg_rating: number | null
  creator_wallet: string
  model: string
}

const CATEGORIES = ['all', 'general', 'defi', 'trading', 'research', 'nft', 'security']

function formatPrice(microUnits: number): string {
  if (microUnits === 0) return 'Free'
  return `$${(microUnits / 1_000_000).toFixed(4)}`
}

export default function SkillsPage() {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | 'mine'>('all')

  const loadSkills = () => {
    setLoading(true)
    fetchSkills({ category: category !== 'all' ? category : undefined, q: search || undefined })
      .then(setSkills)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSkills() }, [category, search])

  const displayed = tab === 'mine' && address
    ? skills.filter(s => s.creator_wallet.toLowerCase() === address.toLowerCase())
    : skills

  const handleDelete = async (skillId: string) => {
    if (!address || !confirm('Are you sure you want to delete this skill?')) return
    try {
      const auth = await signAction(signMessageAsync, address, 'delete-skill', skillId)
      await deleteSkill(skillId, auth)
      loadSkills()
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="bg-background min-h-screen text-text-primary">
      <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-24 pt-24 pb-32">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-end">
          <div className="md:col-span-1">
            <h1 className="font-display text-7xl font-bold tracking-tighter text-text-primary leading-none">
              Skill Marketplace
            </h1>
          </div>
          <div className="md:col-span-2 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border-strong pb-4">
            <p className="font-display italic text-2xl text-text-secondary">
              Browse AI skills. Click to run. Pay per execution.
            </p>
            <Link
              href="/upload"
              className="group flex items-center gap-2 border-b border-text-primary pb-1 text-sm font-medium text-text-primary transition-colors hover:text-accent hover:border-accent"
            >
              Upload Skill
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Tabs: All / My Skills */}
        <div className="flex gap-8 mb-12 border-b border-border-subtle">
          <button onClick={() => setTab('all')}
            className={`pb-3 text-xs uppercase tracking-widest font-bold transition-colors ${
              tab === 'all' ? 'text-text-primary border-b-2 border-text-primary' : 'text-text-tertiary hover:text-text-primary'
            }`}>
            All Skills
          </button>
          <button onClick={() => setTab('mine')}
            className={`pb-3 text-xs uppercase tracking-widest font-bold transition-colors ${
              tab === 'mine' ? 'text-text-primary border-b-2 border-text-primary' : 'text-text-tertiary hover:text-text-primary'
            }`}>
            My Skills {address && tab === 'mine' ? `(${displayed.length})` : ''}
          </button>
        </div>

        {tab === 'mine' && !address && (
          <div className="py-24 border-y border-border-strong text-center">
            <h2 className="font-display text-4xl text-text-primary mb-4 italic">Connect your wallet</h2>
            <p className="text-text-secondary">Connect your wallet to see your published skills.</p>
          </div>
        )}

        {(tab === 'all' || address) && (
          <>
            {/* Search */}
            <div className="mb-8">
              <label htmlFor="skill-search" className="block text-xs text-text-secondary uppercase tracking-widest mb-2">Search</label>
              <input
                id="skill-search"
                type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full bg-surface-dim border border-border-subtle px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-accent outline-none transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-8 mb-16 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`text-xs uppercase tracking-widest border-b pb-1 transition-colors ${
                    category === cat
                      ? 'border-text-primary text-text-primary font-bold'
                      : 'border-transparent text-text-tertiary hover:border-text-primary hover:text-text-primary'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Skill List */}
        {loading ? (
          <div className="space-y-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-4 border-t border-border-subtle pt-8">
                <div className="h-8 bg-surface-dim w-1/3" />
                <div className="h-4 bg-surface-dim w-full" />
                <div className="h-4 bg-surface-dim w-2/3" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-24 border-y border-border-strong text-center">
            <h2 className="font-display text-4xl text-text-primary mb-4 italic">
              {tab === 'mine' ? 'No skills published yet' : 'No skills found'}
            </h2>
            <p className="text-text-secondary">
              <Link href="/upload" className="font-display italic text-accent hover:text-accent-muted transition-colors">
                {tab === 'mine' ? 'Upload your first skill' : 'Upload the first skill'} &rarr;
              </Link>
            </p>
          </div>
        ) : (
          <div className="flex flex-col border-t border-border-subtle">
            {displayed.map(skill => {
              const isOwner = address && skill.creator_wallet.toLowerCase() === address.toLowerCase()
              return (
                <div
                  key={skill.id}
                  className="group grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start py-8 border-b border-border-subtle hover:bg-surface-dim transition-colors px-4 md:px-8"
                >
                  {/* Left: Meta */}
                  <div className="md:col-span-1 flex flex-col items-start">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-surface-dim px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-text-tertiary">
                        {skill.category}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-text-tertiary">
                        {skill.execution_mode === 'once' ? 'Single Run' : 'Streaming'}
                      </span>
                      {isOwner && (
                        <span className="text-[10px] uppercase tracking-widest text-accent font-bold">You</span>
                      )}
                    </div>
                    <Link href={`/skills/${skill.id}`}>
                      <h3 className="font-display font-bold text-3xl text-text-primary tracking-tight mb-3 group-hover:text-accent transition-colors">
                        {skill.name}
                      </h3>
                    </Link>
                    <div className="w-12 h-0.5 bg-accent/30 transition-all duration-300 group-hover:w-24 group-hover:bg-accent" />
                  </div>

                  {/* Right: Description + stats */}
                  <div className="md:col-span-2 flex flex-col h-full justify-between">
                    <Link href={`/skills/${skill.id}`}>
                      <p className="text-text-secondary text-base leading-relaxed mb-6 max-w-3xl">
                        {skill.description}
                      </p>
                    </Link>

                    <div className="grid grid-cols-4 border-t border-border-subtle pt-4 mt-auto items-end">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-text-tertiary mb-1">Model</div>
                        <div className="font-mono text-sm text-text-secondary">{skill.model}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-text-tertiary mb-1">Runs</div>
                        <div className="text-sm text-text-secondary">{skill.run_count}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-text-tertiary mb-1">Rating</div>
                        <div className="text-sm text-text-secondary">
                          {skill.avg_rating ? `★ ${skill.avg_rating.toFixed(1)}` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-accent mb-1 font-bold">Price</div>
                        <div className="font-bold text-lg text-accent">{formatPrice(skill.price_per_run)}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      {isOwner ? (
                        <button onClick={() => handleDelete(skill.id)}
                          className="text-xs text-text-tertiary hover:text-error transition-colors uppercase tracking-widest">
                          Delete
                        </button>
                      ) : <div />}
                      <Link
                        href={`/skills/${skill.id}`}
                        className="bg-text-primary text-surface-elevated px-8 py-3 text-xs uppercase tracking-widest font-bold group-hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        Run Skill
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
