import { MapPin, DollarSign, Clock, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Returns color + bg based on match score thresholds
function matchStyles(score) {
  if (score >= 80)
    return {
      color: "text-emerald-600 dark:text-emerald-400",
      bar: "bg-emerald-500",
      badge:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      label: "High Match",
    };
  if (score >= 60)
    return {
      color: "text-amber-600  dark:text-amber-400",
      bar: "bg-amber-500",
      badge:
        "bg-amber-50  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
      label: "Good Match",
    };
  return {
    color: "text-slate-500  dark:text-slate-400",
    bar: "bg-slate-400",
    badge:
      "bg-slate-100 text-slate-600  dark:bg-slate-700     dark:text-slate-400",
    label: "Partial",
  };
}

// Deterministic color from company name — so the logo looks consistent
function logoColor(name = "") {
  const palette = [
    "#6366f1",
    "#2563EB",
    "#0891b2",
    "#059669",
    "#d97706",
    "#dc2626",
    "#7c3aed",
    "#db2777",
  ];
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function JobCard({ job, loading = false }) {
  const navigate = useNavigate();

  if (loading) {
    // Handled by JobCardSkeleton — this branch is just a safety fallback
    return null;
  }

  const { color, bar, badge, label } = matchStyles(job.matchScore ?? 0);
  const initials =
    job.company
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  const bgColor = logoColor(job.company);

  return (
    <div
      className="
      group relative
      bg-slate-50 dark:bg-slate-800
      border border-slate-200/90 dark:border-white/8
      shadow-md shadow-slate-200/60 dark:shadow-none
      hover:border-blue-200 dark:hover:border-blue-500/30
      rounded-2xl p-5
      transition-all duration-200
      hover:shadow-lg hover:shadow-slate-300/50 hover:shadow-blue-500/8
      dark:hover:shadow-slate-900/50
      cursor-pointer
    "
      onClick={() => navigate(`/jobs/${job._id || job.id}`)}
    >
      {/* Match badge — top right */}
      <span
        className={`absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full ${badge}`}
      >
        {label} {job.matchScore}%
      </span>

      {/* Company logo + job title */}
      <div className="flex items-start gap-3 mb-4 pr-24">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow-sm"
          style={{ background: bgColor }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug truncate">
            {job.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {job.company}
          </p>
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-full">
          <MapPin size={11} /> {job.location}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-full">
          <DollarSign size={11} /> {job.salary}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-full">
          <Clock size={11} /> {job.type || "Full-time"}
        </span>
      </div>

      {/* Match score bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Match score
          </span>
          <span className={`text-xs font-bold ${color}`}>
            {job.matchScore}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${bar}`}
            style={{ width: `${job.matchScore}%` }}
          />
        </div>
      </div>

      {/* View details button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/jobs/${job._id || job.id}`);
        }}
        className="
          w-full py-2 rounded-xl text-xs font-semibold
          bg-blue-50 text-blue-600
          hover:bg-blue-600 hover:text-white
          dark:bg-blue-600/10 dark:text-blue-400
          dark:hover:bg-blue-600 dark:hover:text-white
          transition-all duration-150 flex items-center justify-center gap-1.5
        "
      >
        View Details <ExternalLink size={12} />
      </button>
    </div>
  );
}
