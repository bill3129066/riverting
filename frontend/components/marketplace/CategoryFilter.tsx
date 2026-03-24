export default function CategoryFilter({ categories, selected, onChange }: {
  categories: string[]
  selected: string
  onChange: (cat: string) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {categories.map(cat => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={`px-4 py-1.5 rounded-full text-sm capitalize transition-colors ${
            selected === cat
              ? 'bg-[#00d4aa] text-black font-semibold'
              : 'bg-[#111] border border-[#222] text-[#888] hover:border-[#00d4aa]'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
