import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ArrowLeftCircle,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/users", label: "Users", icon: Users },
];

export default function AdminSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? "bg-violet-600 text-white"
        : "text-slate-600 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 dark:hover:text-violet-300"
    }`;

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900">
      {/* Logo + Admin badge — the visual signal (NFR-A2) that this is
          a distinct context from the main user app. Violet accent
          everywhere in this layout vs. the blue accent used app-wide. */}
      <div className="px-5 py-5 border-b border-slate-200 dark:border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-white text-sm">J</span>
          </div>
          <span className="font-display font-bold text-lg text-slate-900 dark:text-slate-50">
            JobMatch AI
          </span>
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/50 text-violet-700 dark:text-violet-300 text-xs font-semibold px-2.5 py-1 rounded-full">
          <ShieldCheck size={12} />
          Admin
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClasses}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer: admin identity + exit back to main app */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-white/8 space-y-2">
        <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Signed in as
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
            {user?.name}
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeftCircle size={18} />
          Back to main app
        </button>
      </div>
    </aside>
  );
}
