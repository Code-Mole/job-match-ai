import { Briefcase, Target, TrendingUp, BookOpen } from 'lucide-react'
import { Skeleton } from '../ui/LoadingSkeleton'

export default function StatsBar({ stats }) {
  const items = [
    {
      icon:   Briefcase,
      label:  'Jobs available',
      value:  stats?.totalJobs    != null ? stats.totalJobs.toLocaleString() : '—',
      sub:    'in the database',
      color:  'blue',
    },
    {
      icon:   Target,
      label:  'Applied',
      value:  stats?.appliedCount != null ? stats.appliedCount : '—',
      sub:    'jobs applied to',
      color:  'emerald',
    },
    {
      icon:   TrendingUp,
      label:  'Profile strength',
      value:  stats?.profileStrength != null ? `${stats.profileStrength}%` : '—',
      sub:    stats?.cvParsed
        ? stats?.avgMatchScore != null
          ? `Avg job match ${stats.avgMatchScore}%`
          : 'CV analysed ✓'
        : 'Upload CV to boost',
      color:  'amber',
    },
    {
      icon:   BookOpen,
      label:  'Skills on profile',
      value:  stats?.skillCount != null ? stats.skillCount : '—',
      sub:    'extracted from CV',
      color:  'purple',
    },
  ]

  const COLOR = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'text-blue-600 dark:text-blue-400',   iconBg: 'bg-blue-100 dark:bg-blue-900/40'   },
    emerald:{ bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
    amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/40' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20',icon: 'text-purple-600 dark:text-purple-400',iconBg: 'bg-purple-100 dark:bg-purple-900/40'},
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {items.map(({ icon: Icon, label, value, sub, color }) => {
        const c = COLOR[color]
        return (
          <div key={label} className={`rounded-2xl p-4 ${c.bg}`}>
            <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={c.icon} />
            </div>
            {stats == null
              ? <Skeleton className="h-7 w-16 mb-1" />
              : <p className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100 mb-0.5">{value}</p>
            }
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">{label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>
          </div>
        )
      })}
    </div>
  )
}