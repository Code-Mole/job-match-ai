import {
  Briefcase,
  Users,
  TrendingUp,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import useAdminStats from "../../hooks/admin/useAdminStats";
import StatCard from "../../components/admin/StatCard";
import GhanaCoverageBanner from "../../components/admin/GhanaCoverageBanner";
import CountryBreakdownTable from "../../components/admin/CountryBreakdownTable";
import SourceBreakdownPanel from "../../components/admin/SourceBreakdownPanel";
import ActivityFeed from "../../components/admin/ActivityFeed";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";

export default function AdminOverviewPage() {
  const { stats, loading, error, refetch } = useAdminStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <LoadingSkeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {error || "Something went wrong loading the dashboard."}
        </p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
        >
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  const { jobs, users, activity } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-50 mb-1">
            Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            System-wide statistics and recent activity.
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-white/10 px-3 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Briefcase}
          label="Active jobs"
          value={jobs.active.toLocaleString()}
          sublabel={`${jobs.total.toLocaleString()} total, ${jobs.inactive} inactive`}
          accent="violet"
        />
        <StatCard
          icon={TrendingUp}
          label="New jobs (7 days)"
          value={`+${jobs.newLast7Days}`}
          accent="emerald"
        />
        <StatCard
          icon={Users}
          label="Total users"
          value={users.total.toLocaleString()}
          sublabel={`${users.byRole.admin || 0} admin${(users.byRole.admin || 0) === 1 ? "" : "s"}`}
          accent="blue"
        />
        <StatCard
          icon={UserCheck}
          label="Active users"
          value={users.active.toLocaleString()}
          sublabel={`${users.inactive} deactivated · +${users.newLast7Days} this week`}
          accent="amber"
        />
      </div>

      {/* Ghana coverage callout — FR-A15 */}
      <GhanaCoverageBanner
        count={jobs.ghanaCoverage.count}
        percentage={jobs.ghanaCoverage.percentage}
      />

      {/* Breakdown panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CountryBreakdownTable data={jobs.byCountry} />
        <SourceBreakdownPanel bySource={jobs.bySource} />
        <ActivityFeed activity={activity} />
      </div>
    </div>
  );
}
