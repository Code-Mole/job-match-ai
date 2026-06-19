import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileCheck2, AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react'
import useBulkImport from '../../hooks/admin/useBulkImport'

const SAMPLE = `[
  {
    "title": "Customer Service Representative",
    "company": "MTN Ghana",
    "location": "Accra, Ghana",
    "country": "Ghana",
    "region": "Greater Accra",
    "description": "Handle customer inquiries across MTN telecom products and services.",
    "skills": ["Customer Service", "Communication"],
    "industry": "Telecom"
  }
]`

export default function AdminBulkImportPage() {
  const navigate = useNavigate()
  const {
    raw, setRaw, parse, parsed, parseError,
    localValidation, localErrorCount,
    submit, submitting, result, reset,
  } = useBulkImport()

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/jobs')}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-50">Bulk import jobs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Paste a JSON array of job objects to import multiple listings at once.</p>
        </div>
      </div>

      {!result && (
        <>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Job data (JSON array)</label>
              <button
                type="button"
                onClick={() => setRaw(SAMPLE)}
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
              >
                Insert example
              </button>
            </div>
            <textarea
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder="[ { &quot;title&quot;: &quot;...&quot;, &quot;company&quot;: &quot;...&quot;, ... } ]"
              spellCheck={false}
              className="w-full h-72 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
            />

            {parseError && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-700/40 rounded-xl p-3">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                {parseError}
              </div>
            )}

            <button
              onClick={parse}
              disabled={!raw.trim()}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              <FileCheck2 size={15} /> Validate
            </button>
          </div>

          {/* Validation preview */}
          {parsed && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5 mt-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Preview — {parsed.length} job{parsed.length === 1 ? '' : 's'} found
                </h3>
                {localErrorCount === 0 ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} /> All valid
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <AlertCircle size={13} /> {localErrorCount} with issues
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {localValidation.map(row => (
                  <div
                    key={row.index}
                    className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
                      row.errors.length
                        ? 'bg-red-50 dark:bg-red-900/15 text-red-700 dark:text-red-300'
                        : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    <span className="font-mono opacity-60">#{row.index + 1}</span>
                    <span className="flex-1">
                      <span className="font-medium">{row.title}</span>
                      {row.errors.length > 0 && <span className="block opacity-80">{row.errors.join(', ')}</span>}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <UploadCloud size={15} />
                  {submitting ? 'Importing…' : `Import ${parsed.length} job${parsed.length === 1 ? '' : 's'}`}
                </button>
                <button onClick={reset} className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2.5">
                  Clear
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Note: jobs with validation issues will be skipped server-side; valid jobs will still be imported.
              </p>
            </div>
          )}
        </>
      )}

      {/* Result summary */}
      {result && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-6 text-center">
          <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-50 mb-1">Import complete</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{result.message}</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/15 rounded-xl p-3">
              <p className="font-display font-bold text-xl text-emerald-600 dark:text-emerald-400">{result.inserted}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Inserted</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/15 rounded-xl p-3">
              <p className="font-display font-bold text-xl text-blue-600 dark:text-blue-400">{result.updated}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Updated</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/15 rounded-xl p-3">
              <p className="font-display font-bold text-xl text-red-600 dark:text-red-400">{result.failed}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Failed</p>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div className="text-left max-h-48 overflow-y-auto space-y-1.5 mb-6">
              {result.errors.map((e, i) => (
                <div key={i} className="text-xs bg-red-50 dark:bg-red-900/15 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg">
                  #{e.index + 1} — {e.title}: {e.errors.join(', ')}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate('/admin/jobs')} className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
              View jobs
            </button>
            <button onClick={reset} className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2.5">
              Import more
            </button>
          </div>
        </div>
      )}
    </div>
  )
}