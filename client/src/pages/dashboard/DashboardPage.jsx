import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react'
import AppLayout from '../../components/layouts/AppLayout'
import CVUpload from '../../components/dashboard/CVUpload'
import StatsBar from '../../components/dashboard/StatsBar'
import JobCard from '../../components/jobs/JobCard'
import { JobCardSkeleton } from '../../components/ui/LoadingSkeleton'
import { useDashboard }    from '../../hooks/useDashboard'

export default function DashboardPage() {
  const navigate  = useNavigate()
  const [search, setSearch]       = useState('')
  const [cvUploaded, setCvUploaded] = useState(false)

  const {
    jobs,
    loading,
    aiLoading,
    error,
    stats,
    refetch,
    injectCvMatches,
  } = useDashboard()

  const handleCvUpload = (file, parsed) => {
    setCvUploaded(true)
    // Instantly show matched jobs from the CV parse response
    if (parsed?.top_matches?.length) {
      injectCvMatches(parsed.top_matches)
    } else {
      // No matches returned — re-fetch from server with new skills
      refetch()
    }
  }

  const filtered = jobs.filter(j =>
    !search || [j.title, j.company, j.location].some(
      v => v?.toLowerCase().includes(search.toLowerCase())
    )
  )

  return (
    <AppLayout onSearch={setSearch}>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <StatsBar stats={stats} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="xl:col-span-2 space-y-6">

            {/* CV upload */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-50">Your CV</h2>
                {cvUploaded && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                    ✓ Analysed
                  </span>
                )}
              </div>
              <CVUpload onUpload={handleCvUpload} />
            </section>

            {/* Job matches */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-50">
                    {cvUploaded ? 'Your CV Matches' : 'Top Job Matches'}
                  </h2>
                  {aiLoading && <RefreshCw size={13} className="text-blue-400 animate-spin" />}
                </div>
                <button onClick={() => navigate('/jobs')} className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium hover:gap-2 transition-all">
                  See all <ArrowRight size={14} />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-700/50 flex items-center justify-between">
                  <span>{error}</span>
                  <button onClick={refetch} className="underline font-medium ml-2">Retry</button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)
                  : filtered.length > 0
                    ? filtered.slice(0, 4).map(job => <JobCard key={job._id || job.id} job={job} />)
                    : (
                      <div className="col-span-2 text-center py-12 text-slate-400 dark:text-slate-500">
                        <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
                        <p className="text-sm">
                          {search ? 'No jobs match your search.' : 'Upload your CV to see personalised matches.'}
                        </p>
                      </div>
                    )
                }
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div onClick={() => navigate('/assistant')} className="rounded-2xl p-5 cursor-pointer bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <Sparkles size={20} className="text-white" />
              </div>
              <h3 className="font-display font-bold text-white text-base mb-1">AI Career Assistant</h3>
              <p className="text-blue-100 text-xs mb-3">Ask anything about your career, skills, or job matches.</p>
              <div className="flex items-center gap-1 text-white text-xs font-semibold group-hover:gap-2 transition-all">
                Start chatting <ArrowRight size={13} />
              </div>
            </div>

            <div className="rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8">
              <h3 className="font-display font-bold text-slate-900 dark:text-slate-100 text-sm mb-3">Quick Stats</h3>
              <div className="space-y-2">
                {[
                  { label: 'Jobs available',   value: stats?.totalJobs    ?? '—' },
                  { label: 'Applied',          value: stats?.appliedCount ?? 0   },
                  { label: 'Saved',            value: stats?.savedCount   ?? 0   },
                  { label: 'Skills on profile',value: stats?.skillCount   ?? 0   },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/skills')} className="mt-4 w-full text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left">
                View skill gap analysis →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}