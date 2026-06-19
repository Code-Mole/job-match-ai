export default function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent = "violet",
}) {
  const accents = {
    violet:
      "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    emerald:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    amber:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${accents[accent]}`}
        >
          <Icon size={18} />
        </div>
      </div>
      <p className="font-display font-bold text-2xl text-slate-900 dark:text-slate-50 leading-none mb-1">
        {value}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {sublabel && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {sublabel}
        </p>
      )}
    </div>
  );
}
