import { useState } from "react";
import { TrendingUp, BarChart3, Map, Compass } from "lucide-react";
import AppLayout from "../../components/layouts/AppLayout";
import RoleCompare from "../../components/careers/RoleCompare";
import MarketInsights from "../../components/careers/MarketInsights";
import CareerPath from "../../components/careers/CareerPath";

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

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Page header ──────────────────────────────── */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Compass size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-slate-900 dark:text-slate-50 mb-1">
              Career Explorer
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Compare roles, explore market data, and map your path to your
              dream job.
            </p>
          </div>
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

        {/* ── Tab description ──────────────────────────── */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {TABS.find((t) => t.id === activeTab)?.desc}
        </p>

        {/* ── Tab content ──────────────────────────────── */}
        {activeTab === "compare" && <RoleCompare />}
        {activeTab === "market" && <MarketInsights />}
        {activeTab === "path" && <CareerPath />}
      </div>
    </AppLayout>
  );
}
