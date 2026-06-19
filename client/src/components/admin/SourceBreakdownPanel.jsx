const SOURCE_LABELS = {
  admin: "Manually added",
  adzuna: "Adzuna API",
  remotive: "Remotive API",
  seed: "Seed data",
  manual: "Manual entry",
};

const SOURCE_COLORS = {
  admin: "bg-violet-500",
  adzuna: "bg-blue-500",
  remotive: "bg-teal-500",
  seed: "bg-slate-400",
  manual: "bg-amber-500",
};

export default function SourceBreakdownPanel({ bySource }) {
  const entries = Object.entries(bySource || {}).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (!entries.length) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5">
      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">
        Jobs by source
      </h3>

      {/* Stacked bar */}
      <div className="h-2.5 rounded-full overflow-hidden flex mb-4">
        {entries.map(([source, count]) => (
          <div
            key={source}
            className={SOURCE_COLORS[source] || "bg-slate-400"}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${SOURCE_LABELS[source] || source}: ${count}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {entries.map(([source, count]) => (
          <div
            key={source}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${SOURCE_COLORS[source] || "bg-slate-400"}`}
              />
              <span className="text-slate-600 dark:text-slate-400">
                {SOURCE_LABELS[source] || source}
              </span>
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
