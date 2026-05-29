import { useState } from "react";
import { CheckCircle2, XCircle, Users, Briefcase, MapPin } from "lucide-react";
import { CAREER_ROLES, formatSalary } from "../../data/careersData";
import TrendBadge from "./TrendBadge";
import SalaryBar from "./SalaryBar";


// Single role column for the comparison view
function RoleColumn({ role, colorClass, globalMax = 150000 }) {
  if (!role)
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-400 text-sm">
        Select a role to compare
      </div>
    );

  return (
    <div className={`rounded-2xl border-2 overflow-hidden ${colorClass}`}>
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-white/8">
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight mb-1">
          {role.title}
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
          {role.category}
        </span>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {role.description}
        </p>

        {/* Salary */}
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Salary range
          </p>
          <p className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">
            {formatSalary(role.salaryMin, role.salaryMax)}
          </p>
          <SalaryBar
            min={role.salaryMin}
            max={role.salaryMax}
            mid={role.salaryMid}
            globalMax={globalMax}
          />
        </div>

        {/* Key stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Demand",
              value: <TrendBadge trend={role.demandTrend} size="sm" />,
            },
            { label: "Growth", value: role.growthRate },
            { label: "Open roles", value: role.openRoles.toLocaleString() },
            { label: "Min exp", value: `${role.minYears}+ years` },
            { label: "Remote", value: role.remote ? "✓ Yes" : "✗ No" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3"
            >
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {label}
              </p>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Top skills */}
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Required skills
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

        {/* Pros & Cons */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
              Pros
            </p>
            <ul className="space-y-1.5">
              {role.pros.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  <CheckCircle2
                    size={12}
                    className="text-emerald-500 flex-shrink-0 mt-0.5"
                  />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">
              Cons
            </p>
            <ul className="space-y-1.5">
              {role.cons.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  <XCircle
                    size={12}
                    className="text-red-400 flex-shrink-0 mt-0.5"
                  />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Adjacent roles */}
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Adjacent roles
          </p>
          <div className="flex flex-wrap gap-1.5">
            {role.adjacent.map((r) => (
              <span
                key={r}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Top companies */}
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            <Briefcase size={11} className="inline mr-1" />
            Top companies hiring
          </p>
          <div className="flex flex-wrap gap-1.5">
            {role.companies.map((c) => (
              <span
                key={c}
                className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoleCompare({ roles = CAREER_ROLES }) {
  const list = roles.length ? roles : CAREER_ROLES;
  const GLOBAL_MAX = Math.max(...list.map((r) => r.salaryMax || 0), 1);

  const [role1Id, setRole1Id] = useState(list[0]?.id || "frontend");
  const [role2Id, setRole2Id] = useState(list[1]?.id || list[0]?.id || "fullstack");

  const role1 = list.find((r) => r.id === role1Id) || list[0];
  const role2 = list.find((r) => r.id === role2Id) || list[1] || list[0];

  const selectClass = `
    w-full px-4 py-3 rounded-xl text-sm font-medium
    bg-white dark:bg-slate-800
    border border-slate-200 dark:border-white/10
    text-slate-900 dark:text-slate-100
    outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
    transition-all appearance-none cursor-pointer
  `;

  return (
    <div>
      {/* Role selectors */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6">
        <select
          value={role1Id}
          onChange={(e) => setRole1Id(e.target.value)}
          className={selectClass}
        >
          {list.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
              {r.matchScore != null ? ` (${r.matchScore}% match)` : ""}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            VS
          </span>
        </div>

        <select
          value={role2Id}
          onChange={(e) => setRole2Id(e.target.value)}
          className={selectClass}
        >
          {list.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </div>

      {/* Side-by-side columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RoleColumn
          role={role1}
          colorClass="border-blue-200 dark:border-blue-700/40"
          globalMax={GLOBAL_MAX}
        />
        <RoleColumn
          role={role2}
          colorClass="border-indigo-200 dark:border-indigo-700/40"
          globalMax={GLOBAL_MAX}
        />
      </div>
    </div>
  );
}
