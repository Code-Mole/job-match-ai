import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LayoutDashboard, Briefcase, Users, ArrowLeftCircle, ShieldCheck } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/admin',       label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/jobs',  label: 'Jobs',     icon: Briefcase },
  { to: '/admin/users', label: 'Users',    icon: Users },
]

export default function AdminMobileNav() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-violet-600 text-white'
        : 'text-slate-600 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-900/20'
    }`

  return (
    <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/8">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <span className="font-display font-bold text-white text-xs">J</span>
          </div>
          <span className="inline-flex items-center gap-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold px-2 py-0.5 rounded-full">
            <ShieldCheck size={10} />
            Admin
          </span>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-1 border-t border-slate-100 dark:border-white/5 pt-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClasses} onClick={() => setOpen(false)}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => { setOpen(false); navigate('/dashboard') }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <ArrowLeftCircle size={18} />
            Back to main app
          </button>
        </div>
      )}
    </div>
  )
}