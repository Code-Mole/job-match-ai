import { useState, useEffect } from "react";
import AppLayout from "../../components/layouts/AppLayout";
import CVUpload from "../../components/dashboard/CVUpload";
import StatsBar from "../../components/dashboard/StatsBar";
import JobCard from "../../components/jobs/JobCard";
import { JobCardSkeleton } from "../../components/ui/LoadingSkeleton";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ── Sample jobs for the demo (replaced by real API data in Step 5) ───────────
const SAMPLE_JOBS = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "Stripe",
    location: "Remote",
    salary: "$120k–$150k",
    type: "Full-time",
    matchScore: 92,
    skills: ["React", "TypeScript", "Node.js"],
  },
  {
    id: "2",
    title: "Full Stack Engineer",
    company: "Vercel",
    location: "San Francisco, CA",
    salary: "$130k–$160k",
    type: "Full-time",
    matchScore: 85,
    skills: ["React", "Next.js", "PostgreSQL"],
  },
  {
    id: "3",
    title: "React Developer",
    company: "Linear",
    location: "Remote",
    salary: "$110k–$140k",
    type: "Full-time",
    matchScore: 78,
    skills: ["React", "GraphQL", "CSS"],
  },
  {
    id: "4",
    title: "UI Engineer",
    company: "Figma",
    location: "New York, NY",
    salary: "$125k–$155k",
    type: "Full-time",
    matchScore: 71,
    skills: ["React", "WebGL", "TypeScript"],
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cvUploaded, setCvUploaded] = useState(false);

  // Simulate loading (in Step 5, this becomes a real API call)
  useEffect(() => {
    const timer = setTimeout(() => {
      setJobs(SAMPLE_JOBS);
      setLoading(false);
    }, 1200); // 1.2s simulated delay shows the skeleton
    return () => clearTimeout(timer);
  }, []);

  // Filter by search query
  const filtered = jobs.filter(
    (j) =>
      !search ||
      [j.title, j.company, j.location].some((v) =>
        v.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  return (
    <AppLayout onSearch={setSearch}>
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* ── Stats bar ────────────────────────────────── */}
        <StatsBar />

        {/* ── Two-column layout ─────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Left column (wider) ─────────────────── */}
          <div className="xl:col-span-2 space-y-6">
            {/* CV Upload */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-50">
                  Your CV
                </h2>
                {cvUploaded && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                    ✓ Analyzed
                  </span>
                )}
              </div>
              <CVUpload onUpload={() => setCvUploaded(true)} />
            </section>

            {/* Top Job Matches */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={18}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  <h2 className="font-display font-bold text-lg text-slate-900 dark:text-slate-50">
                    Top Job Matches
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/jobs")}
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 font-medium hover:gap-2 transition-all"
                >
                  See all <ArrowRight size={14} />
                </button>
              </div>

              {/* 2-column job grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <JobCardSkeleton key={i} />
                  ))
                ) : filtered.length > 0 ? (
                  filtered
                    .slice(0, 4)
                    .map((job) => <JobCard key={job.id} job={job} />)
                ) : (
                  <div className="col-span-2 text-center py-12 text-slate-400 dark:text-slate-500">
                    <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">
                      No jobs match your search. Try different keywords.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ── Right column (sidebar panel) ─────────── */}
          <div className="space-y-4">
            {/* AI Assistant quick-access */}
            <div
              onClick={() => navigate("/assistant")}
              className="
                rounded-2xl p-5 cursor-pointer
                bg-gradient-to-br from-blue-600 to-indigo-600
                hover:from-blue-700 hover:to-indigo-700
                transition-all duration-200
                group
              "
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <Sparkles size={20} className="text-white" />
              </div>
              <h3 className="font-display font-bold text-white text-base mb-1">
                AI Career Assistant
              </h3>
              <p className="text-blue-100 text-xs mb-3">
                Ask anything about your career, skills, or job matches.
              </p>
              <div className="flex items-center gap-1 text-white text-xs font-semibold group-hover:gap-2 transition-all">
                Start chatting <ArrowRight size={13} />
              </div>
            </div>

            {/* Skill gap quick view */}
            <div className="rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8">
              <h3 className="font-display font-bold text-slate-900 dark:text-slate-100 text-sm mb-3">
                Skill Gap Snapshot
              </h3>
              <div className="space-y-3">
                {[
                  { skill: "TypeScript", pct: 85 },
                  { skill: "System Design", pct: 45 },
                  { skill: "AWS / Cloud", pct: 30 },
                ].map(({ skill, pct }) => (
                  <div key={skill}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {skill}
                      </span>
                      <span className="text-slate-500 dark:text-slate-500">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/skills")}
                className="mt-4 w-full text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left"
              >
                View full analysis →
              </button>
            </div>

            {/* Recent activity */}
            <div className="rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8">
              <h3 className="font-display font-bold text-slate-900 dark:text-slate-100 text-sm mb-3">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {[
                  {
                    action: "Profile viewed by Stripe",
                    time: "2h ago",
                    color: "bg-blue-500",
                  },
                  {
                    action: "New match: Vercel Engineer",
                    time: "5h ago",
                    color: "bg-emerald-500",
                  },
                  {
                    action: "Skill gap report ready",
                    time: "1d ago",
                    color: "bg-purple-500",
                  },
                ].map(({ action, time, color }) => (
                  <div key={action} className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${color}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                        {action}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
