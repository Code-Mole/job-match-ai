import { MapPin, TrendingUp, TrendingDown } from "lucide-react";

export default function GhanaCoverageBanner({ count, percentage }) {
  const isLow = percentage < 15;

  return (
    <div
      className={`rounded-2xl p-5 border flex items-center justify-between gap-4 flex-wrap ${
        isLow
          ? "bg-amber-50 dark:bg-amber-900/15 border-amber-200 dark:border-amber-700/40"
          : "bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-700/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isLow
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
              : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          <MapPin size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Ghana job coverage
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {count} active listing{count === 1 ? "" : "s"} currently tagged to
            Ghana
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`font-display font-bold text-2xl ${
            isLow
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {percentage}%
        </span>
        {isLow ? (
          <TrendingDown size={16} className="text-amber-500" />
        ) : (
          <TrendingUp size={16} className="text-emerald-500" />
        )}
      </div>
    </div>
  );
}
