'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchSkills } from '@/lib/skills-api'

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
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchSkills({ category: category !== 'all' ? category : undefined, q: search || undefined })
      .then(setSkills)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, search])

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
        <p className="text-[#888] mb-6">Browse AI skills. Click to run. Pay per execution.</p>

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

        {/* Grid */}
        {loading ? (
          <div className="text-[#888] mt-8">Loading skills...</div>
        ) : skills.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#666] text-lg mb-4">No skills found</p>
            <Link href="/upload" className="text-[#00d4aa] hover:underline">Upload the first skill</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map(skill => (
              <Link key={skill.id} href={`/skills/${skill.id}`}
                className="bg-[#111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#00d4aa] transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,212,170,0.1)] flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-[#00d4aa]/10 text-[#00d4aa] px-2 py-1 rounded-full uppercase tracking-wide">
                      {skill.category}
                    </span>
                    <span className="text-xs bg-[#222] text-[#888] px-2 py-1 rounded-full">
                      {skill.execution_mode === 'once' ? 'Single Run' : 'Streaming'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{skill.name}</h3>
                  <p className="text-[#888] text-sm mb-4 line-clamp-2">{skill.description}</p>
                </div>

                <div className="border-t border-[#1a1a1a] pt-3 mt-auto">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-xs text-[#666]">
                      <span>{skill.run_count} runs</span>
                      {skill.avg_rating && <span>{'★'} {skill.avg_rating.toFixed(1)}</span>}
                    </div>
                    <span className="text-sm font-semibold text-[#00d4aa]">
                      {formatPrice(skill.price_per_run)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
