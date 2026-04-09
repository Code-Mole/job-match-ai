import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";
import ProfileDropdown from './ProfileDropdown'

// Returns time-appropriate greeting
function getGreeting(name) {
  const hour = new Date().getHours();
  const period = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return `Good ${period}, ${name?.split(" ")[0] || "there"}`;
}

export default function Header({ onSearch }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [hasNotif] = useState(true); // placeholder for real notification state

  const handleSearch = (e) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <header
      className="
      sticky top-0 z-10
      flex items-center gap-4 px-6 py-3.5
      bg-white/80 dark:bg-slate-900/80
      backdrop-blur-xl
      border-b border-slate-200 dark:border-white/8
    "
    >
      {/* Greeting */}
      <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-50 whitespace-nowrap">
        {getGreeting(user?.name)}
      </h2>

      {/* Search bar */}
      <div className="flex-1 max-w-sm relative">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search jobs, skills, companies…"
          className="
            w-full pl-9 pr-4 py-2 rounded-xl text-sm
            bg-slate-100 dark:bg-slate-800
            border border-slate-200 dark:border-white/8
            text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
            transition-all
          "
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Notification bell */}
      <button className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
        <Bell size={18} />
        {hasNotif && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
        {/* <span className="text-xs font-bold text-white">
          {user?.name
            ? user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "U"}
        </span> */}
        <ProfileDropdown />
      </div>
    </header>
  );
}
