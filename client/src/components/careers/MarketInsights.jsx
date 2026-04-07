import { useState } from "react";
import { TrendingUp, Users, DollarSign, BarChart3 } from "lucide-react";
import { CAREER_ROLES, formatSalary } from "../../data/careersData";
import TrendBadge from "./TrendBadge";
import SalaryBar from "./SalaryBar";

const GLOBAL_MAX = Math.max(...CAREER_ROLES.map((r) => r.salaryMax));
const CHART_HEIGHT = 140; // px

// Simple bar chart built with divs — no charting library needed
function SalaryChart({ roles, selectedId, onSelect }) {
  const maxSalary = Math.max(...roles.map((r) => r.salaryMid));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">
            Average salary comparison
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Median annual salary (USD) by role
          </p>
        </div>
        <BarChart3 size={20} className="text-slate-400" />
      </div>

      {/* Bar chart */}
      <div
        className="flex items-end gap-3"
        style={{ height: `${CHART_HEIGHT + 40}px` }}
      >
        {roles.map((role) => {
          const barH = Math.round((role.salaryMid / maxSalary) * CHART_HEIGHT);
          const isSelected = role.id === selectedId;
          const color =
            role.demandTrend === "Increasing"
              ? "#2563EB"
              : role.demandTrend === "Stable"
                ? "#6366f1"
                : "#94a3b8";

          return (
            <div
              key={role.id}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
              onClick={() => onSelect(role.id)}
            >
              {/* Value label */}
              <span
                className={`
                text-xs font-semibold transition-all
                ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
              `}
                style={{ color }}
              >
                ${(role.salaryMid / 1000).toFixed(0)}k
              </span>

              {/* Bar */}
              <div
                className="w-full rounded-t-lg transition-all duration-300 relative"
                style={{
                  height: `${barH}px`,
                  background: isSelected ? color : `${color}60`,
                  minHeight: "8px",
                }}
              >
                {isSelected && (
                  <div
                    className="absolute inset-0 rounded-t-lg animate-pulse opacity-20"
                    style={{ background: color }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`
                text-center leading-tight transition-colors
                ${isSelected ? "text-slate-900 dark:text-slate-100 font-semibold" : "text-slate-500 dark:text-slate-400"}
              `}
                style={{ fontSize: "9px" }}
              >
                {role.title.split(" ").map((w, i) => (
                  <span key={i} className="block">
                    {w}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
        {["Increasing", "Stable"].map((trend) => (
          <div key={trend} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                background: trend === "Increasing" ? "#2563EB" : "#6366f1",
              }}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {trend} demand
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Role card in the grid
function RoleMarketCard({ role, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl p-4 border cursor-pointer transition-all duration-200
        ${
          isSelected
            ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-500/10"
            : "border-slate-200 dark:border-white/8 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600/50"
        }
      `}
    >
      {/* Title + trend */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">
          {role.title}
        </h3>
        <TrendBadge trend={role.demandTrend} size="sm" />
      </div>

      {/* Salary */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        {formatSalary(role.salaryMin, role.salaryMax)}
      </p>

      {/* Salary bar */}
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
          style={{ width: `${(role.salaryMax / GLOBAL_MAX) * 100}%` }}
        />
      </div>

      {/* Open roles */}
      <div className="flex items-center gap-1 mt-2.5">
        <Users size={11} className="text-slate-400" />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {role.openRoles.toLocaleString()} open roles
        </span>
      </div>
    </div>
  );
}

// Detail panel for the selected role
function RoleDetail({ role }) {
  if (!role) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100">
            {role.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {role.category}
          </p>
        </div>
        <TrendBadge trend={role.demandTrend} />
      </div>

      {/* Salary range bar */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Salary range
        </p>
        <p className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
          {formatSalary(role.salaryMin, role.salaryMax)}
        </p>
        <SalaryBar
          min={role.salaryMin}
          max={role.salaryMax}
          mid={role.salaryMid}
          globalMax={GLOBAL_MAX}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: TrendingUp, label: "Growth", value: role.growthRate },
          {
            icon: Users,
            label: "Open roles",
            value: role.openRoles.toLocaleString(),
          },
          {
            icon: DollarSign,
            label: "Avg salary",
            value: `$${(role.salaryMid / 1000).toFixed(0)}k`,
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center"
          >
            <Icon
              size={16}
              className="text-blue-600 dark:text-blue-400 mx-auto mb-1"
            />
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {value}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
        {role.description}
      </p>

      {/* Required skills */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Core skills
        </p>
        <div className="flex flex-wrap gap-1.5">
          {role.skills.map((skill) => (
            <span
              key={skill}
              className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Certifications */}
      {role.certifications?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Valued certifications
          </p>
          <div className="flex flex-wrap gap-1.5">
            {role.certifications.map((cert) => (
              <span
                key={cert}
                className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketInsights() {
  const [selectedId, setSelectedId] = useState("frontend");
  const selectedRole = CAREER_ROLES.find((r) => r.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Salary chart */}
      <SalaryChart
        roles={CAREER_ROLES}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Role cards grid + detail panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Role cards */}
        <div className="xl:col-span-1 space-y-3">
          <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">
            Roles overview
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {CAREER_ROLES.map((role) => (
              <RoleMarketCard
                key={role.id}
                role={role}
                isSelected={role.id === selectedId}
                onClick={() => setSelectedId(role.id)}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-2">
          <h3 className="font-display font-bold text-slate-900 dark:text-slate-100 mb-3">
            Role details
          </h3>
          <RoleDetail role={selectedRole} />
        </div>
      </div>
    </div>
  );
}
