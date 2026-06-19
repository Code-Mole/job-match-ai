import { Briefcase, UserPlus, Pencil, PlusCircle } from "lucide-react";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ActivityFeed({ activity }) {
  if (!activity?.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No recent activity.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-5">
      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-4">
        Recent activity
      </h3>

      <div className="space-y-4">
        {activity.map((item, i) => {
          const isJob = item.type === "job";
          const Icon = isJob
            ? item.action === "created"
              ? PlusCircle
              : Pencil
            : UserPlus;

          return (
            <div key={i} className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isJob
                    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                }`}
              >
                <Icon size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {isJob ? `Job ${item.action}` : "New user"}
                  </span>
                  {" — "}
                  {item.label}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {isJob && item.by ? `by ${item.by} · ` : ""}
                  {isJob && item.country ? `${item.country} · ` : ""}
                  {timeAgo(item.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
