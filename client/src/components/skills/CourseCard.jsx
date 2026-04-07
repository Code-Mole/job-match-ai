import { ExternalLink, Clock, BookOpen, Star } from 'lucide-react'

const PRIORITY_CONFIG = {
  high:   { bg: 'bg-red-50 dark:bg-red-900/20',    text: 'text-red-700 dark:text-red-400',    border: 'border-red-200 dark:border-red-700/50',    label: 'High priority'   },
  medium: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-700/50', label: 'Medium priority' },
  low:    { bg: 'bg-slate-50 dark:bg-slate-800',    text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-white/8',      label: 'Nice to have'    },
}

export default function CourseCard({ item }) {
  // item shape: { skill, priority, resource: { title, provider, url, duration, free } }
  const { skill, priority = 'medium', resource } = item
  const pc = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="
        block rounded-2xl border p-5
        bg-white dark:bg-slate-800
        border-slate-200 dark:border-white/8
        hover:border-blue-300 dark:hover:border-blue-600/50
        hover:shadow-lg hover:shadow-blue-500/8
        transition-all duration-200 group
      "
    >
      {/* Skill badge + priority */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 px-2.5 py-1 rounded-full">
          {skill}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${pc.bg} ${pc.text} ${pc.border}`}>
          {pc.label}
        </span>
      </div>

      {/* Course title */}
      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {resource.title}
      </h4>

      {/* Provider */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
        <BookOpen size={11} />
        {resource.provider}
      </p>

      {/* Footer: duration + free/paid + external link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Duration */}
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Clock size={11} />
            {resource.duration}
          </span>

          {/* Free / Paid badge */}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            resource.free
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
            {resource.free ? 'Free' : 'Paid'}
          </span>
        </div>

        {/* Enroll arrow */}
        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
          Enroll <ExternalLink size={11} />
        </span>
      </div>
    </a>
  )
}