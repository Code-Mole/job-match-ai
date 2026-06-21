import { useNavigate } from 'react-router-dom'
import { Briefcase, ExternalLink, Trash2, MapPin } from 'lucide-react'
import useApplications from '../../hooks/useApplications'

const STATUS_CONFIG = {
  applied:      { label: 'Applied',      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  interviewing: { label: 'Interviewing', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  offered:      { label: 'Offered',      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  rejected:     { label: 'Rejected',     color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  withdrawn:    { label: 'Withdrawn',    color: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' },
}

const STATUS_OPTIONS = Object.keys(STATUS_CONFIG)

export default function ApplicationsPage() {
  const navigate = useNavigate()
  const { applications, loading, updateStatus, removeApplication } = useApplications()

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-50 mb-1">
          My Applications
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {applications.length} job{applications.length === 1 ? '' : 's'} you've applied to
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-10 text-center">
          <Briefcase size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">You haven't applied to any jobs yet.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Browse jobs →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied
            return (
              <div
                key={app._id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5 flex items-start justify-between gap-4 flex-wrap"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      onClick={() => navigate(`/jobs/${app.job._id}`)}
                      className="font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 truncate"
                    >
                      {app.job.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{app.job.company}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {app.job.location}</span>
                    <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={app.status}
                    onChange={e => updateStatus(app._id, e.target.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer ${cfg.color}`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>

                  {app.job.applyUrl && (
                      <a
                      href={app.job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-400"
                      title="View original posting"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}

                  <button
                    onClick={() => removeApplication(app._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                    title="Remove from tracker"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}