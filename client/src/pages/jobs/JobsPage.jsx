import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Briefcase, RefreshCw } from "lucide-react";
import AppLayout from "../../components/layouts/AppLayout";
import FilterBar from "../../components/jobs/FilterBar";
import JobCard from "../../components/jobs/JobCard";
import { JobCardSkeleton } from "../../components/ui/LoadingSkeleton";
import { useJobs } from "../../hooks/useJobs";

// ── Simple pagination component ───────────────────────────────────────────────
function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        Previous
      </button>

      {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        const p = i + 1;
        return (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`
              w-9 h-9 rounded-xl text-sm font-medium transition-all
              ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }
            `}
          >
            {p}
          </button>
        );
      })}

      <button
        disabled={page === pages}
        onClick={() => onPage(page + 1)}
        className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        Next
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Briefcase size={28} className="text-slate-400" />
      </div>
      <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">
        {hasFilters ? "No jobs match your filters" : "No jobs available yet"}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">
        {hasFilters
          ? "Try adjusting your search criteria or clearing some filters."
          : "Jobs will appear here once the database is seeded."}
      </p>
      {hasFilters && (
        <button onClick={onReset} className="btn-primary px-6">
          Clear filters
        </button>
      )}
    </div>
  );
}

export default function JobsPage() {
  const navigate = useNavigate();
  const {
    jobs,
    filters,
    updateFilter,
    resetFilters,
    loading,
    aiLoading,
    error,
    total,
    pages,
    goToPage,
    refetchScores,
  } = useJobs();

  const hasFilters = !!(
    filters.search ||
    filters.location ||
    filters.type ||
    filters.level ||
    filters.remote
  );

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-6"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* ── Filter bar (sticky) ────────────────────────────── */}
        <FilterBar
          filters={filters}
          onUpdate={updateFilter}
          onReset={resetFilters}
          total={total}
        />

        {/* ── Page content ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* AI score loading banner */}
            {aiLoading && (
              <div className="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-sm text-blue-700 dark:text-blue-300">
                <RefreshCw size={14} className="animate-spin" />
                Calculating AI match scores…
              </div>
            )}

            {/* Jobs grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {jobs.map((job) => (
                    <JobCard key={job._id} job={job} />
                  ))}
                </div>

                <Pagination
                  page={filters.page}
                  pages={pages}
                  onPage={goToPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
