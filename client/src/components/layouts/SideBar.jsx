import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  Zap,
  MessageSquare,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

// Each nav item definition — path, icon component, label
const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/jobs", icon: Briefcase, label: "Jobs" },
  { path: "/careers", icon: TrendingUp, label: "Careers" },
  { path: "/skills", icon: Zap, label: "Skills" },
  { path: "/assistant", icon: MessageSquare, label: "AI Assistant" },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    // w-[260px] matches the spec exactly. h-screen + sticky top-0 keeps it visible while content scrolls.
    <aside
      className="
      w-[260px] h-screen sticky top-0 flex-shrink-0
      flex flex-col
      bg-white dark:bg-slate-900
      border-r border-slate-200 dark:border-white/8
    "
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 dark:border-white/5">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="font-display font-bold text-white text-base">J</span>
        </div>
        <span className="font-display font-bold text-lg text-slate-900 dark:text-slate-50 leading-none">
          JobMatch AI
        </span>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          // Use exact match for dashboard so /jobs doesn't also highlight Dashboard
          const isActive =
            path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(path);

          return (
            <NavLink
              key={path}
              to={path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium transition-all duration-150
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5"
                }
              `}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {label}
              {/* Active indicator dot */}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── User profile + Logout ────────────────────────── */}
      <div className="p-3 border-t border-slate-100 dark:border-white/5">
        {/* User info row */}
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
              {user?.email || ""}
            </p>
          </div>
        </div>

        {/* Settings */}
        <button
          className="
          w-full flex items-center gap-3 px-3 py-2 rounded-xl
          text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100
          dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5
          transition-all duration-150
        "
        >
          <Settings size={16} />
          Settings
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="
            w-full flex items-center gap-3 px-3 py-2 rounded-xl
            text-sm text-red-500 hover:text-red-600 hover:bg-red-50
            dark:text-red-400 dark:hover:bg-red-900/20
            transition-all duration-150
          "
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
