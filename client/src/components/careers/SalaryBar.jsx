/**
 * Visual salary range bar — shows min, mid, and max salary
 * with a gradient bar and markers.
 */
export default function SalaryBar({ min, max, mid, globalMax = 200000 }) {
  const leftPct = (min / globalMax) * 100;
  const widthPct = ((max - min) / globalMax) * 100;
  const midPct = (mid / globalMax) * 100;

  const fmt = (n) => `$${(n / 1000).toFixed(0)}k`;

  return (
    <div className="mt-3">
      {/* Labels */}
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
        <span>{fmt(min)}</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          ~{fmt(mid)} avg
        </span>
        <span>{fmt(max)}</span>
      </div>

      {/* Track */}
      <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        {/* Range fill */}
        <div
          className="absolute top-0 h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
      </div>

      {/* Midpoint marker */}
      <div className="relative h-1 mt-0.5">
        <div
          className="absolute w-0.5 h-3 -top-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"
          style={{ left: `${midPct}%` }}
        />
      </div>
    </div>
  );
}
