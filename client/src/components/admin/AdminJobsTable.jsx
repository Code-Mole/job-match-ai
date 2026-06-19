import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Pencil, Trash2, RotateCcw, MapPin } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

const SOURCE_BADGES = {
  admin:
    "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
  adzuna: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  remotive: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
  seed: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  manual:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
};

export default function AdminJobsTable({
  jobs,
  loading,
  onToggleFeatured,
  onDelete,
  onReactivate,
}) {
  const navigate = useNavigate();
  const [confirmTarget, setConfirmTarget] = useState(null); // { job, permanent }
  const [working, setWorking] = useState(false);

  const handleConfirmDelete = async () => {
    setWorking(true);
    const ok = await onDelete(confirmTarget.job._id, confirmTarget.permanent);
    setWorking(false);
    if (ok) setConfirmTarget(null);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-8 text-center text-sm text-slate-400">
        Loading jobs…
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-10 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No jobs match the current filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/8 text-left">
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                  Job
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                  Location
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                  Source
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job._id}
                  className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {job.featured && (
                        <Star
                          size={13}
                          className="text-amber-400 fill-amber-400 flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                          {job.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                          {job.company}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <MapPin size={12} className="flex-shrink-0" />
                      <span className="truncate max-w-[140px]">
                        {job.country
                          ? `${job.region ? job.region + ", " : ""}${job.country}`
                          : job.location}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${SOURCE_BADGES[job.source] || SOURCE_BADGES.manual}`}
                    >
                      {job.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        job.isActive
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {job.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onToggleFeatured(job._id, job.featured)}
                        title={
                          job.featured
                            ? "Remove from featured"
                            : "Mark as featured"
                        }
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                          job.featured
                            ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                        }`}
                      >
                        <Star
                          size={15}
                          className={job.featured ? "fill-amber-400" : ""}
                        />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/jobs/${job._id}/edit`)}
                        title="Edit job"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      {job.isActive ? (
                        <button
                          onClick={() =>
                            setConfirmTarget({ job, permanent: false })
                          }
                          title="Deactivate job"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onReactivate(job._id)}
                          title="Reactivate job"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmTarget}
        title={
          confirmTarget?.permanent
            ? "Permanently delete job?"
            : "Deactivate this job?"
        }
        message={
          confirmTarget?.permanent
            ? `This will permanently remove "${confirmTarget?.job.title}" from the database. This cannot be undone.`
            : `"${confirmTarget?.job.title}" will be hidden from users and excluded from AI matching. You can reactivate it later.`
        }
        confirmLabel={
          confirmTarget?.permanent ? "Delete permanently" : "Deactivate"
        }
        danger
        loading={working}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
