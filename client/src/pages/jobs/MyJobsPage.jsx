import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Star, ArrowLeft } from "lucide-react";
import axios from "axios";
import AppLayout from "../../components/layouts/AppLayout";
import JobCard from "../../components/jobs/JobCard";
import { JobCardSkeleton } from "../../components/ui/LoadingSkeleton";

export default function MyJobsPage({ variant = "applied" }) {
  const isApplied = variant === "applied";
  const endpoint = isApplied ? "/api/jobs/my/applied" : "/api/jobs/my/saved";
  const title = isApplied ? "Applied jobs" : "Saved jobs";
  const Icon = isApplied ? Briefcase : Star;
  const emptyMessage = isApplied
    ? "You have not applied to any jobs yet. Browse jobs and click Apply to track them here."
    : "No saved jobs yet. Save jobs from the job board to review them later.";

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    axios
      .get(endpoint)
      .then(({ data }) => {
        if (!cancelled) {
          setJobs(data.jobs || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message || "Failed to load jobs.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 mb-6"
        >
          <ArrowLeft size={16} /> Back to all jobs
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Icon className="text-blue-600 dark:text-blue-400" size={22} />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-slate-900 dark:text-slate-50">
              {title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isApplied
                ? "Jobs you have applied to through JobMatch AI"
                : "Jobs you bookmarked for later"}
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="surface-card rounded-2xl p-12 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">{emptyMessage}</p>
            <Link to="/jobs" className="btn-primary inline-flex px-5">
              Browse jobs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <div key={job._id} className="relative">
                <JobCard job={{ ...job, matchScore: job.matchScore ?? 0 }} />
                {isApplied && job.appliedAt && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 px-1">
                    Applied {new Date(job.appliedAt).toLocaleDateString()}
                    {job.status ? ` · ${job.status}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
