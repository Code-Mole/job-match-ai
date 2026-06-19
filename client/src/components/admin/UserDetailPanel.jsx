import {
  X,
  Mail,
  MapPin,
  Briefcase,
  Bookmark,
  FileText,
  Calendar,
} from "lucide-react";

export default function UserDetailPanel({ isOpen, loading, detail, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/8 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/8 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-50">
            User profile
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {loading || !detail ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="p-5 space-y-6">
            {/* Identity */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xl font-bold flex items-center justify-center flex-shrink-0">
                {detail.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {detail.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                  <Mail size={12} /> {detail.email}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  detail.role === "admin"
                    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {detail.role}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  detail.isActive
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                }`}
              >
                {detail.isActive ? "Active" : "Deactivated"}
              </span>
            </div>

            {/* Quick facts */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1">
                  <MapPin size={11} /> Location
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {detail.location || "Not set"}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1">
                  <Calendar size={11} /> Joined
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {new Date(detail.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1">
                  <FileText size={11} /> CV status
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {detail.cvParsed ? "Uploaded" : "Not uploaded"}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
                  Years experience
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {detail.yearsExp ?? "—"}
                </p>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Skills ({detail.skills?.length || 0})
              </h3>
              {detail.skills?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {detail.skills.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  No skills on profile.
                </p>
              )}
            </div>

            {/* Saved jobs */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                <Bookmark size={13} /> Saved jobs (
                {detail.savedJobs?.length || 0})
              </h3>
              {detail.savedJobs?.length ? (
                <div className="space-y-1.5">
                  {detail.savedJobs.slice(0, 5).map((j) => (
                    <div
                      key={j._id}
                      className="text-xs bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2"
                    >
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {j.title}
                      </p>
                      <p className="text-slate-400 dark:text-slate-500">
                        {j.company} · {j.location}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  No saved jobs.
                </p>
              )}
            </div>

            {/* Applied jobs */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                <Briefcase size={13} /> Applied jobs (
                {detail.appliedJobs?.length || 0})
              </h3>
              {detail.appliedJobs?.length ? (
                <div className="space-y-1.5">
                  {detail.appliedJobs.slice(0, 5).map((a, i) => (
                    <div
                      key={i}
                      className="text-xs bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          {a.job?.title || "Job removed"}
                        </p>
                        <p className="text-slate-400 dark:text-slate-500">
                          {a.job?.company}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  No applications yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
