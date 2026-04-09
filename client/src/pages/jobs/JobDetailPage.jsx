import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  BookOpen,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Share2,
  TrendingUp,
  Users,
  Star,
} from "lucide-react";
import AppLayout from "../../components/layouts/AppLayout";
import { Skeleton } from "../../components/ui/LoadingSkeleton";
import { useJob } from "../../hooks/useJob";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useToast } from '../../components/ui/Toast';

// ── Circular match score indicator ────────────────────────────────────────────
function ScoreCircle({ score }) {
  if (score == null) return null;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#94a3b8";
  const label =
    score >= 80 ? "High Match" : score >= 60 ? "Good Match" : "Partial Match";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Score arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold" style={{ color }}>
            {score}%
          </span>
        </div>
      </div>
      <span
        className="mt-2 text-xs font-semibold px-3 py-1 rounded-full"
        style={{
          background:
            score >= 80 ? "#d1fae5" : score >= 60 ? "#fef3c7" : "#f1f5f9",
          color: score >= 80 ? "#065f46" : score >= 60 ? "#92400e" : "#475569",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Component score bar ───────────────────────────────────────────────────────
function ComponentBar({ label, value, color }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          {label}
        </span>
        <span className="font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Loading skeleton for job detail ──────────────────────────────────────────
function JobDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Skeleton className="h-6 w-24 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-40 w-full mt-4" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { job, gap, loading, error } = useJob(id);

  const [saved, setSaved] = useState(() => user?.savedJobs?.includes(id));
  const [applied, setApplied] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description"); // 'description' | 'requirements' | 'skills'
  const toast = useToast();

  const handleSave = async () => {
    setSaved((prev) => !prev);
    try {
      await axios.post(`/api/jobs/${id}/save`);
    } catch {
      setSaved((prev) => !prev);
    } // revert on error
  };

  // const handleApply = async () => {
  //   if (applied) return;
  //   setApplyLoading(true);
  //   try {
  //     // If job has an apply URL, open it; otherwise mark as applied internally
  //     if (job.applyUrl) {
  //       window.open(job.applyUrl, "_blank");
  //     }
  //     await axios.post(`/api/jobs/${id}/apply`);
  //     setApplied(true);
  //   } catch (err) {
  //     // For demo, just mark as applied even if API fails
  //     setApplied(true);
  //   } finally {
  //     setApplyLoading(false);
  //   }
  // };
  const handleApply = async () => {
  if (applied || applyLoading) return
  setApplyLoading(true)
  try {
    const { data } = await axios.post(`/api/jobs/${id}/apply`)

    if (data.alreadyApplied) {
      toast('You already applied to this job', 'info')
    } else {
      setApplied(true)
      toast(`Application to ${job.title} recorded! Check your email for confirmation.`, 'success')
    }

    // Open the real application URL in a new tab
    if (data.applyUrl) {
      setTimeout(() => window.open(data.applyUrl, '_blank', 'noopener,noreferrer'), 300)
    }

  } catch (err) {
    toast(err.response?.data?.message || 'Failed to submit application. Please try again.', 'error')
  } finally {
    setApplyLoading(false)
  }
}

  if (loading)
    return (
      <AppLayout>
        <JobDetailSkeleton />
      </AppLayout>
    );

  if (error || !job) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
          <XCircle size={40} className="text-red-400" />
          <p className="text-slate-600 dark:text-slate-400">
            {error || "Job not found."}
          </p>
          <button
            onClick={() => navigate("/jobs")}
            className="btn-primary px-6"
          >
            Back to Jobs
          </button>
        </div>
      </AppLayout>
    );
  }

  // Extract match data
  const matchScore = gap?.overall_readiness ?? job.matchScore ?? null;
  const matchedSkills = gap?.matched_skills ?? job.matchedSkills ?? [];
  const missingSkills = gap?.missing_skills ?? job.missingSkills ?? [];
  const componentScores = job.componentScores || null;

  // Logo color from company name
  const logoColors = [
    "#6366f1",
    "#2563EB",
    "#0891b2",
    "#059669",
    "#d97706",
    "#7c3aed",
  ];
  let hash = 0;
  for (const c of job.company || "")
    hash = c.charCodeAt(0) + ((hash << 5) - hash);
  const logoColor = logoColors[Math.abs(hash) % logoColors.length];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── Back button ─────────────────────────────────────── */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6 group transition-colors"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Jobs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: main content ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job header */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/8">
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-bold text-white shadow-sm"
                  style={{ background: logoColor }}
                >
                  {job.company?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-50 leading-tight mb-1">
                    {job.title}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {job.company}
                    {job.companySize && (
                      <span className="text-slate-400">
                        {" "}
                        · {job.companySize}
                      </span>
                    )}
                  </p>
                </div>
                {/* Save + Share buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleSave}
                    className={`p-2.5 rounded-xl border transition-all ${
                      saved
                        ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-400"
                        : "border-slate-200 dark:border-white/10 text-slate-500 hover:text-blue-600 hover:border-blue-300"
                    }`}
                  >
                    {saved ? (
                      <BookmarkCheck size={18} />
                    ) : (
                      <Bookmark size={18} />
                    )}
                  </button>
                  <button className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  { icon: MapPin, text: job.location },
                  { icon: DollarSign, text: job.salary },
                  { icon: Clock, text: job.type },
                  { icon: Building2, text: job.level },
                  { icon: Users, text: job.industry },
                ]
                  .filter((m) => m.text)
                  .map(({ icon: Icon, text }) => (
                    <span
                      key={text}
                      className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-3 py-1.5 rounded-full"
                    >
                      <Icon size={13} />
                      {text}
                    </span>
                  ))}
                {job.remote && (
                  <span className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50 px-3 py-1.5 rounded-full">
                    Remote ✓
                  </span>
                )}
                {job.demandTrend === "Increasing" && (
                  <span className="flex items-center gap-1 text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
                    <TrendingUp size={13} /> High demand
                  </span>
                )}
              </div>
            </div>

            {/* ── Tab navigation ────────────────────────────── */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: "description", label: "Description" },
                { id: "requirements", label: "Requirements" },
                { id: "skills", label: "Skills match" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all
                    ${
                      activeTab === tab.id
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab content ───────────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/8">
              {activeTab === "description" && (
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 mb-4">
                    About the role
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>

                  {job.responsibilities?.length > 0 && (
                    <>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-6 mb-3 text-sm">
                        Responsibilities
                      </h3>
                      <ul className="space-y-2">
                        {job.responsibilities.map((r, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {activeTab === "requirements" && (
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 mb-4">
                    Requirements
                  </h2>
                  {job.requirements?.length > 0 ? (
                    <ul className="space-y-3">
                      {job.requirements.map((req, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400"
                        >
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500 flex-shrink-0 mt-0.5"
                          />
                          {req}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 text-sm">
                      No specific requirements listed.
                    </p>
                  )}

                  {job.yearsExp > 0 && (
                    <div className="mt-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <span className="font-semibold">
                          {job.yearsExp}+ years
                        </span>{" "}
                        of experience required
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "skills" && (
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 mb-4">
                    Skills comparison
                  </h2>

                  {matchedSkills.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-3">
                        ✓ You have these ({matchedSkills.length})
                      </p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {matchedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50"
                          >
                            <CheckCircle2 size={13} /> {skill}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {missingSkills.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3">
                        Skills to develop ({missingSkills.length})
                      </p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {missingSkills.map((skill) => (
                          <span
                            key={skill}
                            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50"
                          >
                            <BookOpen size={13} /> {skill}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {matchedSkills.length === 0 && missingSkills.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-slate-400 text-sm">
                        Upload your CV to see your personalised skills
                        comparison.
                      </p>
                      <button
                        onClick={() => navigate("/")}
                        className="mt-3 btn-primary px-5 text-sm"
                      >
                        Upload CV
                      </button>
                    </div>
                  )}

                  {/* All required skills */}
                  {job.skills?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                      <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                        All required skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: score card + apply ────────────────────── */}
          <div className="space-y-4">
            {/* Match score card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-white/8 text-center">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                Your match score
              </p>
              {matchScore != null ? (
                <ScoreCircle score={matchScore} />
              ) : (
                <div className="py-4">
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Upload your CV to get your match score
                  </p>
                  <button
                    onClick={() => navigate("/")}
                    className="mt-3 btn-primary px-4 text-sm py-2"
                  >
                    Upload CV
                  </button>
                </div>
              )}

              {/* Component score breakdown */}
              {componentScores && (
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/5 text-left">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                    Score breakdown
                  </p>
                  <ComponentBar
                    label="Skill match"
                    value={componentScores.skill_match}
                    color="#2563EB"
                  />
                  <ComponentBar
                    label="Experience fit"
                    value={componentScores.experience_fit}
                    color="#8b5cf6"
                  />
                  <ComponentBar
                    label="Growth align"
                    value={componentScores.growth_align}
                    color="#10b981"
                  />
                  <ComponentBar
                    label="Cultural fit"
                    value={componentScores.cultural_fit}
                    color="#f59e0b"
                  />
                </div>
              )}
            </div>

            {/* Apply card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-white/8">
              <button
                onClick={handleApply}
                disabled={applyLoading || applied}
                className={`
                  w-full py-3 rounded-xl font-semibold text-sm transition-all mb-3
                  ${
                    applied
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50 cursor-default"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                  }
                `}
              >
                {applyLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : applied ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> Applied!
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Apply Now <ExternalLink size={14} />
                  </span>
                )}
              </button>

              <button
                onClick={handleSave}
                className={`
                  w-full py-2.5 rounded-xl font-medium text-sm border transition-all
                  ${
                    saved
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-400"
                      : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600"
                  }
                `}
              >
                {saved ? "✓ Saved" : "Save for later"}
              </button>

              {job.deadline && (
                <p className="text-center text-xs text-red-500 dark:text-red-400 mt-3">
                  Closes {new Date(job.deadline).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Learning path quick view (from skill gap) */}
            {gap?.learning_path?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-white/8">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-3 flex items-center gap-2">
                  <BookOpen size={15} className="text-blue-600" />
                  Recommended learning
                </h3>
                <div className="space-y-3">
                  {gap.learning_path.slice(0, 3).map(({ skill, resource }) => (
                    <a
                      key={skill}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-white/5 transition-all group"
                    >
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                        {skill}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                        {resource.title}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-400">
                          {resource.provider}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${resource.free ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"}`}
                        >
                          {resource.free ? "Free" : "Paid"}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/skills")}
                  className="mt-3 w-full text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  View full learning path →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
