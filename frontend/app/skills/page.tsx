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
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Skill Marketplace</h1>
          <Link href="/upload"
            className="bg-[#00d4aa] text-black font-bold px-5 py-2.5 rounded-xl hover:bg-[#00b894] transition-colors text-sm">
            + Upload Skill
          </Link>
        </div>
        <p className="text-[#888] mb-4">Browse AI skills. Click to run. Pay per execution.</p>

        {/* Tabs: All / My Skills */}
        <div className="flex gap-4 mb-5 border-b border-[#222]">
          <button onClick={() => setTab('all')}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === 'all' ? 'text-[#00d4aa] border-b-2 border-[#00d4aa]' : 'text-[#888] hover:text-white'
            }`}>
            All Skills
          </button>
          <button onClick={() => setTab('mine')}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === 'mine' ? 'text-[#00d4aa] border-b-2 border-[#00d4aa]' : 'text-[#888] hover:text-white'
            }`}>
            My Skills {address && tab === 'mine' ? `(${displayed.length})` : ''}
          </button>
        </div>

        {tab === 'mine' && !address && (
          <div className="text-center py-16">
            <p className="text-[#666] text-lg">Connect your wallet to see your skills</p>
          </div>
        )}

        {(tab === 'all' || address) && (
          <>
            {/* Search */}
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] focus:border-[#00d4aa] outline-none mb-4"
            />

            {/* Category Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === cat
                      ? 'bg-[#00d4aa] text-black'
                      : 'bg-[#111] text-[#888] border border-[#222] hover:border-[#00d4aa] hover:text-white'
                  }`}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-[#888] mt-8">Loading skills...</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#666] text-lg mb-4">
              {tab === 'mine' ? 'You haven\'t uploaded any skills yet' : 'No skills found'}
            </p>
            <Link href="/upload" className="text-[#00d4aa] hover:underline">
              {tab === 'mine' ? 'Upload your first skill' : 'Upload the first skill'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map(skill => {
              const isOwner = address && skill.creator_wallet.toLowerCase() === address.toLowerCase()
              return (
                <div key={skill.id} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#00d4aa] transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,212,170,0.1)] flex flex-col">
                  <Link href={`/skills/${skill.id}`} className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-[#00d4aa]/10 text-[#00d4aa] px-2 py-1 rounded-full uppercase tracking-wide">
                        {skill.category}
                      </span>
                      <span className="text-xs bg-[#222] text-[#888] px-2 py-1 rounded-full">
                        {skill.execution_mode === 'once' ? 'Single Run' : 'Streaming'}
                      </span>
                      {isOwner && (
                        <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">You</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{skill.name}</h3>
                    <p className="text-[#888] text-sm mb-4 line-clamp-2">{skill.description}</p>
                  </Link>

                  <div className="border-t border-[#1a1a1a] pt-3 mt-auto">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 text-xs text-[#666]">
                        <span>{skill.run_count} runs</span>
                        {skill.avg_rating && <span>{'★'} {skill.avg_rating.toFixed(1)}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <button onClick={() => handleDelete(skill.id)}
                            className="text-xs text-[#666] hover:text-red-400 transition-colors">
                            Delete
                          </button>
                        )}
                        <span className="text-sm font-semibold text-[#00d4aa]">
                          {formatPrice(skill.price_per_run)}
                        </span>
                      </div>
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
