import { useState } from "react";
import {
  Search,
  MapPin,
  Briefcase,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(true);

  const hasActiveFilters =
    filters.search ||
    filters.location ||
    filters.type ||
    filters.level ||
    filters.remote ||
    filters.salaryMin;

  const activeCount = [
    filters.search,
    filters.location,
    filters.type,
    filters.level,
    filters.remote,
  ].filter(Boolean).length;

  const selectClass = `
    w-full sm:w-auto min-w-0
    px-4 py-2.5 rounded-xl text-sm appearance-none
    bg-slate-100 dark:bg-slate-800
    border border-slate-200 dark:border-white/8
    text-slate-700 dark:text-slate-300
    outline-none focus:border-blue-500 transition-all cursor-pointer
  `;

  return (
    <div
      className="
      bg-white dark:bg-slate-900
      border-b border-slate-200 dark:border-white/8
      sticky top-0 z-10
    "
    >
      {/* Mobile: compact search + toggle row */}
      <div className="md:hidden px-4 pt-3 pb-2 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((o) => !o)}
            className="flex-1 flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/8 text-slate-700 dark:text-slate-300"
          >
            <span className="flex items-center gap-2 truncate">
              <Search size={15} className="text-slate-400 shrink-0" />
              {filters.search || "Search jobs…"}
            </span>
            {mobileSearchOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((o) => !o)}
            className={`
              flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border shrink-0
              ${
                mobileFiltersOpen || activeCount
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/8 text-slate-700 dark:text-slate-300"
              }
            `}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeCount > 0 && (
              <span className="ml-0.5 w-5 h-5 rounded-full bg-white/25 text-xs flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {mobileSearchOpen && (
          <div className="relative">
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
                w-full pl-9 pr-9 py-2.5 rounded-xl text-sm
                bg-slate-100 dark:bg-slate-800
                border border-slate-200 dark:border-white/8
                text-slate-900 dark:text-slate-100
                placeholder-slate-400
                outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              "
              autoFocus
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onUpdate("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop + collapsible mobile filters */}
      <div
        className={`
        ${mobileFiltersOpen ? "block" : "hidden"} md:block
        flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center
        px-4 sm:px-6 py-3 md:py-4
      `}
      >
        {/* Search — desktop only (mobile uses collapsible above) */}
        <div className="relative hidden md:block flex-1 min-w-[200px]">
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
              type="button"
              onClick={() => onUpdate("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative w-full md:w-auto shrink-0">
          <MapPin
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={filters.location}
            onChange={(e) => onUpdate("location", e.target.value)}
            className={`pl-8 pr-8 py-2.5 rounded-xl text-sm appearance-none ${selectClass}`}
          >
            <option value="">All locations</option>
            {LOCATIONS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-auto shrink-0">
          <Briefcase
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={filters.type}
            onChange={(e) => onUpdate("type", e.target.value)}
            className={`pl-8 pr-8 py-2.5 rounded-xl text-sm appearance-none ${selectClass}`}
          >
            <option value="">All types</option>
            {JOB_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <select
          value={filters.level}
          onChange={(e) => onUpdate("level", e.target.value)}
          className={selectClass}
        >
          <option value="">All levels</option>
          {LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onUpdate("remote", !filters.remote)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium w-full md:w-auto justify-center
            border transition-all duration-200
            ${
              filters.remote
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/8 text-slate-600 dark:text-slate-400 hover:border-blue-400"
            }
          `}
        >
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

        <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto justify-between md:justify-end flex-wrap">
          {mobileFiltersOpen && (
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="md:hidden text-xs text-slate-500 underline"
            >
              Close filters
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <SlidersHorizontal size={14} className="text-slate-400 hidden md:block" />
            <select
              value={filters.sort}
              onChange={(e) => onUpdate("sort", e.target.value)}
              className={selectClass}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 px-4 sm:px-6 pb-3 flex-wrap">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {total}
          </span>{" "}
          jobs found
          {filters.sort === "match" && (
            <span className="ml-2 text-blue-600 dark:text-blue-400 text-xs">
              · ranked by CV fit
            </span>
          )}
        </span>

        {filters.search && (
          <span className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-700/50">
            "{filters.search}"
            <button type="button" onClick={() => onUpdate("search", "")}>
              <X size={11} />
            </button>
          </span>
        )}
        {filters.location && (
          <span className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-700/50">
            {filters.location}
            <button type="button" onClick={() => onUpdate("location", "")}>
              <X size={11} />
            </button>
          </span>
        )}
        {filters.remote && (
          <span className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-700/50">
            Remote only
            <button type="button" onClick={() => onUpdate("remote", false)}>
              <X size={11} />
            </button>
          </span>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
