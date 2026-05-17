import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Briefcase,
  Star,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../ui/Toast";

function Avatar({ name, size = "md" }) {
  const initials = (name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div
      className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast("Signed out successfully", "info");
    navigate("/login");
  };

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const menuItems = [
    {
      icon: User,
      label: "View profile",
      action: () => go("/settings?tab=account"),
    },
    {
      icon: Briefcase,
      label: "Applied jobs",
      action: () => go("/jobs/applied"),
    },
    { icon: Star, label: "Saved jobs", action: () => go("/jobs/saved") },
    { icon: Settings, label: "Settings", action: () => go("/settings") },
  ];

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="h-10 flex items-center gap-1.5 pl-1 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Avatar name={user?.name} size="sm" />
        <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
          {user?.name?.split(" ")[0] || "Account"}
        </span>
        <ChevronDown
          size={14}
          className={`hidden lg:block text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="
          absolute right-0 top-full mt-2 w-64 z-50
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-white/10
          rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-slate-900/40
          overflow-hidden
          animate-in fade-in slide-in-from-top-2 duration-150
        "
        >
          {/* User info header */}
          <div className="px-4 py-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || ""}
                </p>
                {user?.headline && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 truncate mt-0.5">
                    {user.headline}
                  </p>
                )}
              </div>
            </div>

            {/* CV status badge */}
            <div
              className={`mt-3 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ${
                user?.cvParsed
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
              }`}
            >
              <span>{user?.cvParsed ? "✓" : "!"}</span>
              {user?.cvParsed
                ? "CV analysed — matches ready"
                : "Upload your CV for better matches"}
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            {menuItems.map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all text-left"
              >
                <Icon size={15} className="text-slate-400 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="p-1.5 border-t border-slate-100 dark:border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left"
            >
              <LogOut size={15} className="flex-shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
