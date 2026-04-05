import { Briefcase, Target, TrendingUp, BookOpen } from "lucide-react";

const STATS = [
  {
    icon: Briefcase,
    label: "Jobs Matched",
    value: "24",
    change: "+3 today",
    color: "blue",
  },
  {
    icon: Target,
    label: "Avg Match Score",
    value: "78%",
    change: "+5% this week",
    color: "emerald",
  },
  {
    icon: TrendingUp,
    label: "Profile Strength",
    value: "65%",
    change: "Upload CV to boost",
    color: "amber",
  },
  {
    icon: BookOpen,
    label: "Skills to Learn",
    value: "6",
    change: "View roadmap",
    color: "purple",
  },
];

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50   dark:bg-blue-900/20",
    icon: "text-blue-600   dark:text-blue-400",
    icon_bg: "bg-blue-100   dark:bg-blue-900/40",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    icon: "text-emerald-600 dark:text-emerald-400",
    icon_bg: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  amber: {
    bg: "bg-amber-50  dark:bg-amber-900/20",
    icon: "text-amber-600  dark:text-amber-400",
    icon_bg: "bg-amber-100  dark:bg-amber-900/40",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    icon_bg: "bg-purple-100 dark:bg-purple-900/40",
  },
};

export default function StatsBar() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {STATS.map(({ icon: Icon, label, value, change, color }) => {
        const c = COLOR_MAP[color];
        return (
          <div
            key={label}
            className={`rounded-2xl p-4 ${c.bg} border border-transparent`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-xl ${c.icon_bg} flex items-center justify-center`}
              >
                <Icon size={18} className={c.icon} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100 mb-0.5">
              {value}
            </p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-0.5">
              {label}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {change}
            </p>
          </div>
        );
      })}
    </div>
  );
}
