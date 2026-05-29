import { Link } from "react-router-dom";
import { Briefcase, Sparkles } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-white/8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Briefcase size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-slate-900 dark:text-slate-100">
              JobMatch AI
            </span>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Dashboard
            </Link>
            <Link to="/jobs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Jobs
            </Link>
            <Link to="/careers" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Careers
            </Link>
            <Link to="/skills" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Skills
            </Link>
            <Link
              to="/settings"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Settings
            </Link>
          </nav>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500 dark:text-slate-500">
          <p>© {year} JobMatch AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <Sparkles size={12} className="text-blue-500" />
            AI-powered career matching
          </p>
        </div>
      </div>
    </footer>
  );
}
