export default function CategoryFilter({ categories, selected, onChange }: {
  categories: string[]
  selected: string
  onChange: (cat: string) => void
}) {
  return (
    <div className="flex space-x-8">
      {categories.map(cat => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={`text-xs uppercase tracking-widest border-b pb-1 transition-colors ${
            selected === cat
              ? 'border-text-primary text-text-primary font-bold'
              : 'border-transparent text-text-tertiary hover:border-text-primary hover:text-text-primary'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
