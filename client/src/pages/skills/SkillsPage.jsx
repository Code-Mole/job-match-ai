import { useState, useEffect } from "react";
import {
  Zap,
  BookOpen,
  User,
  RefreshCw,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import AppLayout from "../../components/layouts/AppLayout";
import CircularProgress from "../../components/skills/CircularProgress";
import SkillBar from "../../components/skills/SkillBar";
import CourseCard from "../../components/skills/CourseCard";
import SkillTag from "../../components/skills/SkillTag";
import AddSkillInput from "../../components/skills/AddSkillInput";
import { Skeleton } from "../../components/ui/LoadingSkeleton";
import { useSkillGap, useUserSkills } from "../../hooks/useSkillGap";
import { useMatchedJobs } from "../../hooks/useMatchedJobs";
import { useAuth } from "../../context/AuthContext";
import { SKILL_GROUPS } from "../../data/skillsData";

// ── Loading skeleton for the gap analysis panel ───────────────────────────────
function GapSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/8">
        <Skeleton className="w-44 h-44 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
      <div className="lg:col-span-3 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
            <Skeleton className="h-3 w-28 flex-shrink-0" />
            <Skeleton className="h-2 flex-1 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Score breakdown bar ───────────────────────────────────────────────────────
function ScoreBreakdown({ scores }) {
  if (!scores) return null;
  const items = [
    { label: "Skill match", value: scores.skill_match, color: "#2563EB" },
    { label: "Experience fit", value: scores.experience_fit, color: "#8b5cf6" },
    { label: "Growth align", value: scores.growth_align, color: "#10b981" },
    { label: "Cultural fit", value: scores.cultural_fit, color: "#f59e0b" },
  ];
  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        Score breakdown
      </p>
      {items.map(({ label, value, color }) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              {label}
            </span>
            <span className="font-bold" style={{ color }}>
              {value ?? "—"}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${value ?? 0}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Gap Analysis tab ──────────────────────────────────────────────────────────
function GapAnalysisTab() {
  const { user } = useAuth();
  const { jobs: matchedJobs, loading: jobsLoading, error: jobsError } =
    useMatchedJobs(12);
  const [selectedJobId, setSelectedJobId] = useState("");

  const jobList = matchedJobs.length > 0 ? matchedJobs : [];
  const selectedJob = jobList.find((j) => String(j._id) === String(selectedJobId)) || jobList[0];

  useEffect(() => {
    if (selectedJob?._id && !selectedJobId) setSelectedJobId(String(selectedJob._id));
  }, [selectedJob, selectedJobId]);

  const { gap, loading, error, refetch } = useSkillGap(
    selectedJob?._id,
    selectedJob,
  );

  // Build skill rows combining gap data with proficiency placeholders
  const matchedSkills = (gap?.matched_skills || []).map((skill) => ({
    skill,
    proficiency: 75, // placeholder — Step 11 adds self-assessment quizzes
    status: "have",
  }));

  const missingSkills = (gap?.learning_path || []).map((item) => ({
    skill: item.skill,
    proficiency: 0,
    status: "missing",
    priority: item.priority,
  }));

  return (
    <div className="space-y-6">
      {/* Job selector */}
      <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/8">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Analyse against job
          </label>
          <div className="relative">
            <select
              value={selectedJobId || selectedJob?._id || ""}
              onChange={(e) => setSelectedJobId(e.target.value)}
              disabled={jobsLoading || jobList.length === 0}
              className="
                w-full px-4 py-2.5 rounded-xl text-sm appearance-none
                bg-slate-100 dark:bg-slate-700
                border border-slate-200 dark:border-white/10
                text-slate-900 dark:text-slate-100
                outline-none focus:border-blue-500 transition-all cursor-pointer
                disabled:opacity-60
              "
            >
              {jobList.length === 0 ? (
                <option value="">Upload CV to load matched jobs</option>
              ) : (
                jobList.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} — {job.company}
                    {job.match_score != null ? ` (${job.match_score}% match)` : ""}
                  </option>
                ))
              )}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* No skills state */}
      {jobsError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-sm text-amber-800 dark:text-amber-300">
          {jobsError}
        </div>
      )}

      {!loading && !error && (user?.skills || []).length === 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
            No skills on your profile yet
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Upload your CV or add skills manually on the "My Skills" tab to see
            a personalised gap analysis.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Main analysis layout */}
      {loading ? (
        <GapSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ── Left: ring + score breakdown ─────────── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/8 flex flex-col items-center">
            <CircularProgress
              score={gap?.overall_readiness ?? selectedJob?.match_score ?? 0}
              size={160}
              strokeWidth={14}
              label={selectedJob?.title || "Select a job"}
              sublabel={
                selectedJob?.match_score != null
                  ? `${selectedJob.match_score}% match · ${matchedSkills.length} skills aligned`
                  : `${matchedSkills.length} of ${matchedSkills.length + missingSkills.length} skills matched`
              }
            />
            <ScoreBreakdown scores={gap?.component_scores || selectedJob?.component_scores} />
          </div>

          {/* ── Right: skill bars ────────────────────── */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/8">
            {matchedSkills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Skills you have ({matchedSkills.length})
                </h3>
                <div className="space-y-3">
                  {matchedSkills.map((item) => (
                    <SkillBar key={item.skill} {...item} />
                  ))}
                </div>
              </div>
            )}

            {missingSkills.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Skills to develop ({missingSkills.length})
                </h3>
                <div className="space-y-3">
                  {missingSkills.map((item) => (
                    <SkillBar key={item.skill} {...item} />
                  ))}
                </div>
              </div>
            )}

            {matchedSkills.length === 0 && missingSkills.length === 0 && (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <Zap size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">
                  Add skills to your profile to see your gap analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── My Skills tab ─────────────────────────────────────────────────────────────
function MySkillsTab() {
  const { skills, addSkill, removeSkill, saving } = useUserSkills();

  // Group skills by category for a more organised view
  const grouped = Object.entries(SKILL_GROUPS).reduce(
    (acc, [group, groupSkills]) => {
      const mine = skills.filter((s) => groupSkills.includes(s));
      if (mine.length > 0) acc[group] = mine;
      return acc;
    },
    {},
  );

  const ungrouped = skills.filter(
    (s) => !Object.values(SKILL_GROUPS).flat().includes(s),
  );

  return (
    <div className="space-y-6">
      {/* Add skill input */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/8">
        <h3 className="font-display font-bold text-slate-900 dark:text-slate-100 mb-1">
          Add skills to your profile
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Skills you add here are used for AI job matching and gap analysis.
        </p>
        <AddSkillInput
          existingSkills={skills}
          onAdd={addSkill}
          disabled={saving}
        />
      </div>

      {/* Skills display — grouped by category */}
      {skills.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/8">
          <Zap
            size={36}
            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
          />
          <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            No skills yet
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload your CV on the dashboard or add skills manually above.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">
              Your skills
            </h3>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {skills.length} skill{skills.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-5">
            {Object.entries(grouped).map(([group, groupSkills]) => (
              <div key={group}>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
                  {group}
                </p>
                <div className="flex flex-wrap gap-2">
                  {groupSkills.map((skill) => (
                    <SkillTag
                      key={skill}
                      skill={skill}
                      onRemove={removeSkill}
                      variant="default"
                    />
                  ))}
                </div>
              </div>
            ))}

            {ungrouped.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
                  Other
                </p>
                <div className="flex flex-wrap gap-2">
                  {ungrouped.map((skill) => (
                    <SkillTag
                      key={skill}
                      skill={skill}
                      onRemove={removeSkill}
                      variant="default"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Learning Path tab ─────────────────────────────────────────────────────────
function LearningPathTab() {
  const { jobs: matchedJobs, loading: jobsLoading } = useMatchedJobs(12);
  const [selectedJobId, setSelectedJobId] = useState("");
  const jobList = matchedJobs;
  const selectedJob = jobList.find((j) => String(j._id) === String(selectedJobId)) || jobList[0];

  useEffect(() => {
    if (selectedJob?._id && !selectedJobId) setSelectedJobId(String(selectedJob._id));
  }, [selectedJob, selectedJobId]);

  const { gap, loading } = useSkillGap(selectedJob?._id, selectedJob);

  const learningPath = gap?.learning_path || [];

  // Separate by priority
  const highPriority = learningPath.filter((i) => i.priority === "high");
  const mediumPriority = learningPath.filter((i) => i.priority === "medium");
  const lowPriority = learningPath.filter((i) => i.priority === "low");

  const totalHours = learningPath.reduce((sum, item) => {
    const hours = parseInt(item.resource?.duration) || 0;
    return sum + hours;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header with job selector and stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-white/8">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Learning path for
          </label>
          <div className="relative">
            <select
              value={selectedJobId || selectedJob?._id || ""}
              onChange={(e) => setSelectedJobId(e.target.value)}
              disabled={jobsLoading || jobList.length === 0}
              className="
                w-full px-4 py-2.5 rounded-xl text-sm appearance-none
                bg-slate-100 dark:bg-slate-700
                border border-slate-200 dark:border-white/10
                text-slate-900 dark:text-slate-100
                outline-none focus:border-blue-500 cursor-pointer
                disabled:opacity-60
              "
            >
              {jobList.length === 0 ? (
                <option value="">Upload CV to load matched jobs</option>
              ) : (
                jobList.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title} — {j.company}
                  </option>
                ))
              )}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Skills to learn",
              value: learningPath.length,
              color: "text-amber-600 dark:text-amber-400",
            },
            {
              label: "Est. hours",
              value: `~${totalHours}h`,
              color: "text-blue-600 dark:text-blue-400",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-white/8 text-center"
            >
              <p className={`text-2xl font-display font-bold ${color}`}>
                {value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-white/8 p-5 space-y-3"
            >
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : learningPath.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/8">
          <BookOpen
            size={36}
            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
          />
          <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            No learning path generated yet
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Add skills to your profile to see personalised course
            recommendations.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            {
              label: "High priority — learn these first",
              items: highPriority,
              accent: "text-red-600 dark:text-red-400",
            },
            {
              label: "Medium priority",
              items: mediumPriority,
              accent: "text-amber-600 dark:text-amber-400",
            },
            {
              label: "Nice to have",
              items: lowPriority,
              accent: "text-slate-500 dark:text-slate-400",
            },
          ]
            .filter((section) => section.items.length > 0)
            .map(({ label, items, accent }) => (
              <div key={label}>
                <h3 className={`font-semibold text-sm mb-3 ${accent}`}>
                  {label}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <CourseCard key={item.skill} item={item} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Main SkillsPage component ─────────────────────────────────────────────────
const TABS = [
  { id: "gap", label: "Gap Analysis", icon: Zap },
  { id: "skills", label: "My Skills", icon: User },
  { id: "learning", label: "Learning Path", icon: BookOpen },
];

export default function SkillsPage() {
  const [activeTab, setActiveTab] = useState("gap");

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ── Page header ──────────────────────────── */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-slate-900 dark:text-slate-50 mb-1">
              Skills & Learning
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Understand your skill gaps, manage your profile, and follow a
              personalised learning path.
            </p>
          </div>
        </div>

        {/* ── Tab navigation ───────────────────────── */}
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

        {/* ── Tab content ──────────────────────────── */}
        {activeTab === "gap" && <GapAnalysisTab />}
        {activeTab === "skills" && <MySkillsTab />}
        {activeTab === "learning" && <LearningPathTab />}
      </div>
    </AppLayout>
  );
}
