import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import useJobForm from '../../hooks/admin/useJobForm'
import { FormField, inputClasses, selectClasses, textareaClasses } from '../../components/admin/FormField'
import TagInput from '../../components/admin/TagInput'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import { GHANA_REGIONS } from '../../constants/ghanaRegions'

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']
const JOB_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal']
const TRENDS = ['Increasing', 'Stable', 'Decreasing']

export default function AdminJobFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { form, setField, loading, saving, errors, submit, isEdit } = useJobForm(id)

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        {Array.from({ length: 6 }).map((_, i) => <LoadingSkeleton key={i} className="h-12 rounded-xl" />)}
      </div>
    )
  }

  const handleSubmit = (e) => { e.preventDefault(); submit() }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/jobs')}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-50">
            {isEdit ? 'Edit job' : 'Add job'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isEdit ? 'Update an existing listing.' : 'Create a new listing manually.'}
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-700/40 rounded-xl p-4 mb-5">
          <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-0.5">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Basic info ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Basic information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Job title" required>
              <input className={inputClasses} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Branch Operations Officer" />
            </FormField>
            <FormField label="Company" required>
              <input className={inputClasses} value={form.company} onChange={e => setField('company', e.target.value)} placeholder="e.g. Ecobank Ghana" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Location" required hint="Free-text display string">
              <input className={inputClasses} value={form.location} onChange={e => setField('location', e.target.value)} placeholder="e.g. Accra, Ghana" />
            </FormField>
            <FormField label="Country">
              <input className={inputClasses} value={form.country} onChange={e => setField('country', e.target.value)} placeholder="e.g. Ghana" />
            </FormField>
            <FormField label="Region">
              {form.country.trim().toLowerCase() === 'ghana' ? (
                <select className={selectClasses} value={form.region} onChange={e => setField('region', e.target.value)}>
                  <option value="">Select a region…</option>
                  {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input className={inputClasses} value={form.region} onChange={e => setField('region', e.target.value)} placeholder="e.g. California" />
              )}
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Job type">
              <select className={selectClasses} value={form.type} onChange={e => setField('type', e.target.value)}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Level">
              <select className={selectClasses} value={form.level} onChange={e => setField('level', e.target.value)}>
                {JOB_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </FormField>
            <FormField label="Years experience required">
              <input type="number" min="0" className={inputClasses} value={form.yearsExp} onChange={e => setField('yearsExp', e.target.value)} />
            </FormField>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={form.remote} onChange={e => setField('remote', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" />
            This is a remote-friendly position
          </label>
        </div>

        {/* ── Compensation ───────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Compensation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <FormField label="Min salary">
              <input type="number" min="0" className={inputClasses} value={form.salaryMin} onChange={e => setField('salaryMin', e.target.value)} />
            </FormField>
            <FormField label="Max salary">
              <input type="number" min="0" className={inputClasses} value={form.salaryMax} onChange={e => setField('salaryMax', e.target.value)} />
            </FormField>
            <FormField label="Currency">
              <input className={inputClasses} value={form.currency} onChange={e => setField('currency', e.target.value)} placeholder="GHS" />
            </FormField>
            <FormField label="Display string" hint="Shown on job cards">
              <input className={inputClasses} value={form.salary} onChange={e => setField('salary', e.target.value)} placeholder="GHS 4,000 – 6,000 / mo" />
            </FormField>
          </div>
        </div>

        {/* ── Description & details ─────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Description & details</h2>

          <FormField label="Description" required>
            <textarea className={textareaClasses} value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Role summary, responsibilities, what the candidate will be doing..." />
          </FormField>

          <TagInput label="Required skills" values={form.skills} onChange={v => setField('skills', v)} placeholder="e.g. Excel, Customer Service" />
          <TagInput label="Requirements" values={form.requirements} onChange={v => setField('requirements', v)} placeholder="e.g. Bachelor's degree in Business" />
          <TagInput label="Responsibilities" values={form.responsibilities} onChange={v => setField('responsibilities', v)} placeholder="e.g. Manage daily branch operations" />
        </div>

        {/* ── Company & metadata ─────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Company & metadata</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Industry">
              <input className={inputClasses} value={form.industry} onChange={e => setField('industry', e.target.value)} placeholder="e.g. Banking" />
            </FormField>
            <FormField label="Company size">
              <input className={inputClasses} value={form.companySize} onChange={e => setField('companySize', e.target.value)} placeholder="e.g. 500-1000 employees" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Apply URL" hint="External application link, if any">
              <input className={inputClasses} value={form.applyUrl} onChange={e => setField('applyUrl', e.target.value)} placeholder="https://..." />
            </FormField>
            <FormField label="Application deadline">
              <input type="date" className={inputClasses} value={form.deadline} onChange={e => setField('deadline', e.target.value)} />
            </FormField>
          </div>

          <FormField label="Demand trend" hint="Used by the AI matching engine's growth-alignment score">
            <select className={selectClasses} value={form.demandTrend} onChange={e => setField('demandTrend', e.target.value)}>
              {TRENDS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
        </div>

        {/* ── Visibility ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Visibility</h2>
          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={form.isActive} onChange={e => setField('isActive', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" />
            Active (visible to users and included in AI matching)
          </label>
          <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={form.featured} onChange={e => setField('featured', e.target.checked)} className="w-4 h-4 rounded accent-violet-600" />
            Featured
          </label>
        </div>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 sticky bottom-0 bg-slate-50 dark:bg-slate-950 py-4 -mx-1 px-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create job'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/jobs')}
            className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2.5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}