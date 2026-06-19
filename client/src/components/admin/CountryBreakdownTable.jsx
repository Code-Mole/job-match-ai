import { Globe2 } from "lucide-react";

export default function CountryBreakdownTable({ data }) {
  if (!data?.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No job data available yet.
        </p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count));

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe2 size={16} className="text-slate-400" />
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
          Jobs by country
        </h3>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {data.map(({ country, count }) => (
          <div key={country}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span
                className={`font-medium ${
                  country === "Ghana"
                    ? "text-violet-700 dark:text-violet-300"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {country}
                {country === "Ghana" && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-violet-500" />
                )}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {count}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${country === "Ghana" ? "bg-violet-500" : "bg-slate-300 dark:bg-slate-600"}`}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
