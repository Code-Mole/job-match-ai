import { useState } from "react";
import { TrendingUp, BarChart3, Map, Compass, RefreshCw } from "lucide-react";
import RoleCompare from "../../components/careers/RoleCompare";
import MarketInsights from "../../components/careers/MarketInsights";
import CareerPath from "../../components/careers/CareerPath";
import { useCareerInsights } from "../../hooks/useCareerInsights";

const TABS = [
  {
    id: "compare",
    label: "Role Comparison",
    icon: TrendingUp,
    desc: "Compare two roles side by side",
  },
  {
    id: "market",
    label: "Market Insights",
    icon: BarChart3,
    desc: "Salary data and demand trends",
  },
  {
    id: "path",
    label: "Career Paths",
    icon: Map,
    desc: "Step-by-step career progression maps",
  },
];

export default function CareersPage() {
  const [activeTab, setActiveTab] = useState("compare");
  const { roles, careerPaths, marketSummary, personalized, loading, error, refetch } =
    useCareerInsights();

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Page header ──────────────────────────────── */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Compass size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-slate-50 mb-1">
              Career Explorer
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
              {personalized
                ? "Insights tailored to your CV, skills, and top job matches."
                : "Upload your CV on the dashboard for personalized career insights."}
            </p>
            {personalized && (
              <span className="inline-block mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full">
                Personalized for you
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={refetch}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            aria-label="Refresh insights"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── Tab navigation ───────────────────────────── */}
        <div className="flex gap-2 mb-8 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${
                  activeTab === id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }
              `}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-sm text-amber-800 dark:text-amber-300">
            {error} Showing available market data.
          </div>
        )}

        {/* ── Tab description ──────────────────────────── */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {TABS.find((t) => t.id === activeTab)?.desc}
        </p>

        {/* ── Tab content ──────────────────────────────── */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-sm">
            Loading career insights…
          </div>
        ) : (
          <>
            {activeTab === "compare" && <RoleCompare roles={roles} />}
            {activeTab === "market" && (
              <MarketInsights roles={roles} marketSummary={marketSummary} />
            )}
            {activeTab === "path" && <CareerPath paths={careerPaths} roles={roles} />}
          </>
        )}
      </div>
  );
}
