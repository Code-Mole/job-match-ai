import { Search, MapPin, Briefcase, SlidersHorizontal, X } from "lucide-react";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const LOCATIONS = [
  "Remote",
  "San Francisco, CA",
  "New York, NY",
  "Austin, TX",
  "London, UK",
];
const LEVELS = ["Junior", "Mid", "Senior", "Lead"];
const SORT_OPTIONS = [
  { value: "match", label: "Best match" },
  { value: "salary", label: "Highest salary" },
  { value: "recent", label: "Most recent" },
];

export default function FilterBar({ filters, onUpdate, onReset, total }) {
  const hasActiveFilters =
    filters.search ||
    filters.location ||
    filters.type ||
    filters.level ||
    filters.remote ||
    filters.salaryMin;

  return (
    <div
      className="
      bg-white dark:bg-slate-900
      border-b border-slate-200 dark:border-white/8
      sticky top-0 z-10
    "
    >
      {/* ── Main filter row ──────────────────────────────────────── */}
      <div
        className="
        flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center
        px-4 sm:px-6 py-4
        overflow-x-auto sm:overflow-visible
      "
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[min(100%,12rem)] sm:min-w-[200px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onUpdate("search", e.target.value)}
            placeholder="Search title, skill, company…"
            className="
              w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
              bg-slate-100 dark:bg-slate-800
              border border-slate-200 dark:border-white/8
              text-slate-900 dark:text-slate-100
              placeholder-slate-400 dark:placeholder-slate-500
              outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              transition-all
            "
          />
          {filters.search && (
            <button
              onClick={() => onUpdate("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Location */}
        <div className="relative w-full sm:w-auto shrink-0">
          <MapPin
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={filters.location}
            onChange={(e) => onUpdate("location", e.target.value)}
            className="
              pl-8 pr-8 py-2.5 rounded-xl text-sm appearance-none
              bg-slate-100 dark:bg-slate-800
              border border-slate-200 dark:border-white/8
              text-slate-700 dark:text-slate-300
              outline-none focus:border-blue-500
              transition-all cursor-pointer
            "
          >
            <option value="">All locations</option>
            {LOCATIONS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Job type */}
        <div className="relative w-full sm:w-auto shrink-0">
          <Briefcase
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={filters.type}
            onChange={(e) => onUpdate("type", e.target.value)}
            className="
              pl-8 pr-8 py-2.5 rounded-xl text-sm appearance-none
              bg-slate-100 dark:bg-slate-800
              border border-slate-200 dark:border-white/8
              text-slate-700 dark:text-slate-300
              outline-none focus:border-blue-500
              transition-all cursor-pointer
            "
          >
            <option value="">All types</option>
            {JOB_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Level */}
        <select
          value={filters.level}
          onChange={(e) => onUpdate("level", e.target.value)}
          className="
            w-full sm:w-auto min-w-0
            px-4 py-2.5 rounded-xl text-sm appearance-none
            bg-slate-100 dark:bg-slate-800
            border border-slate-200 dark:border-white/8
            text-slate-700 dark:text-slate-300
            outline-none focus:border-blue-500 transition-all cursor-pointer
          "
        >
          <option value="">All levels</option>
          {LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>

        {/* Remote toggle */}
        <button
          onClick={() => onUpdate("remote", !filters.remote)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium w-full sm:w-auto justify-center
            border transition-all duration-200
            ${
              filters.remote
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/8 text-slate-600 dark:text-slate-400 hover:border-blue-400"
            }
          `}
        >
          {/* Toggle pill */}
          <span
            className={`
            w-8 h-4 rounded-full transition-all duration-200 relative flex-shrink-0
            ${filters.remote ? "bg-white/30" : "bg-slate-300 dark:bg-slate-600"}
          `}
          >
            <span
              className={`
              absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200
              ${filters.remote ? "left-[18px]" : "left-0.5"}
            `}
            />
          </span>
          Remote only
        </button>

        {/* Sort */}
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto justify-end flex-wrap">
          <SlidersHorizontal size={14} className="text-slate-400" />
          <select
            value={filters.sort}
            onChange={(e) => onUpdate("sort", e.target.value)}
            className="
              px-3 py-2.5 rounded-xl text-sm appearance-none
              bg-slate-100 dark:bg-slate-800
              border border-slate-200 dark:border-white/8
              text-slate-700 dark:text-slate-300
              outline-none focus:border-blue-500 transition-all cursor-pointer
            "
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Results count + active filter chips ─────────────────── */}
      <div className="flex items-center gap-3 px-4 sm:px-6 pb-3 flex-wrap">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {total}
          </span>{" "}
          jobs found
        </span>

        {/* Active filter chips */}
        {filters.search && (
          <span className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-700/50">
            "{filters.search}"
            <button onClick={() => onUpdate("search", "")}>
              <X size={11} />
            </button>
          </span>
        )}
        {filters.location && (
          <span className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-700/50">
            {filters.location}
            <button onClick={() => onUpdate("location", "")}>
              <X size={11} />
            </button>
          </span>
        )}
        {filters.remote && (
          <span className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-700/50">
            Remote only
            <button onClick={() => onUpdate("remote", false)}>
              <X size={11} />
            </button>
          </span>
        )}

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
