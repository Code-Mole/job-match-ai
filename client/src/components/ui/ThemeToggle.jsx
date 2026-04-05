import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        p-2 rounded-xl transition-all duration-200
        text-slate-500 hover:text-slate-900
        bg-slate-100 hover:bg-slate-200
        dark:text-slate-400 dark:hover:text-slate-100
        dark:bg-slate-800 dark:hover:bg-slate-700
        ${className}
      `}
    >
      {isDark ? (
        <Sun size={18} strokeWidth={2} />
      ) : (
        <Moon size={18} strokeWidth={2} />
      )}
    </button>
  );
}
