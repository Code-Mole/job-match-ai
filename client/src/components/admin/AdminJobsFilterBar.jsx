import { Search, X } from 'lucide-react'

const SOURCES = [
  { value: '',         label: 'All sources' },
  { value: 'admin',    label: 'Manually added' },
  { value: 'adzuna',   label: 'Adzuna API' },
  { value: 'remotive', label: 'Remotive API' },
  { value: 'seed',     label: 'Seed data' },
]

const STATUS_OPTIONS = [
  { value: '',      label: 'All statuses' },
  { value: 'true',  label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

const FEATURED_OPTIONS = [
  { value: '',      label: 'All jobs' },
  { value: 'true',  label: 'Featured only' },
  { value: 'false', label: 'Not featured' },
]

export default function AdminJobsFilterBar({ filters, onChange, onClear }) {
  const hasActiveFilters = Object.entries(filters).some(([k, v]) => v !== '')
  const selectClasses = "text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={e => onChange('search', e.target.value)}
            placeholder="Search title, company..."
            className="w-full text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Country */}
        <input
          type="text"
          value={filters.country}
          onChange={e => onChange('country', e.target.value)}
          placeholder="Country (e.g. Ghana)"
          className="text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 w-40 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        {/* Source */}
        <select value={filters.source} onChange={e => onChange('source', e.target.value)} className={selectClasses}>
          {SOURCES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Status */}
        <select value={filters.isActive} onChange={e => onChange('isActive', e.target.value)} className={selectClasses}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Featured */}
        <select value={filters.featured} onChange={e => onChange('featured', e.target.value)} className={selectClasses}>
          {FEATURED_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 px-2"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>
    </div>
  )
}