import { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";
import ProfileDropdown from "./ProfileDropdown";

function getGreeting(name) {
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `Good ${period}, ${name?.split(" ")[0] || "there"}`;
}

const iconBtn =
  "h-10 w-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors";

export default function Header({ onSearch, onOpenMenu }) {
  const { user } = useAuth();
  const [hasNotif] = useState(true);

  return (
    <header
      className="
      sticky top-0 z-[30] shrink-0
      flex items-center gap-3 px-3 sm:px-6 py-3
      bg-white/90 dark:bg-slate-900/90
      backdrop-blur-xl
      border-b border-slate-200 dark:border-white/8
    "
    >
      <button
        type="button"
        className={`${iconBtn} md:hidden bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300`}
        aria-label="Open menu"
        onClick={() => onOpenMenu?.()}
      >
        <Menu size={20} />
      </button>

      <h2 className="font-display font-bold text-base sm:text-lg text-slate-800 dark:text-slate-50 min-w-0 truncate flex-1 md:flex-none">
        {getGreeting(user?.name)}
      </h2>

      <div className="hidden md:block flex-1" aria-hidden="true" />

      <div className="flex items-center gap-2 ml-auto shrink-0">
        <ThemeToggle className={`${iconBtn} !p-0`} />

        <button
          type="button"
          aria-label="Notifications"
          className={`${iconBtn} relative bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100`}
        >
          <Bell size={18} />
          {hasNotif && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        <ProfileDropdown />
      </div>
    </header>
  );
}
