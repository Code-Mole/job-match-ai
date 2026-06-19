import { useState } from 'react'
import { X, Plus } from 'lucide-react'

export default function TagInput({ label, values, onChange, placeholder = 'Type and press Enter' }) {
  const [draft, setDraft] = useState('')

  const addTag = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (values.includes(trimmed)) { setDraft(''); return }
    onChange([...values, trimmed])
    setDraft('')
  }

  const removeTag = (tag) => onChange(values.filter(v => v !== tag))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:bg-violet-200 dark:hover:bg-violet-800 rounded-full p-0.5">
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="button"
          onClick={addTag}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}