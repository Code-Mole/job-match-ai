import { ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CAREER_PATHS = [
  {
    id: "frontend-path",
    title: "Frontend Track",
    color: "blue",
    steps: [
      {
        role: "Junior Frontend Dev",
        years: "0–2 yrs",
        salary: "$60k–$90k",
        skills: ["HTML", "CSS", "JavaScript", "React"],
      },
      {
        role: "Frontend Developer",
        years: "2–4 yrs",
        salary: "$90k–$130k",
        skills: ["React", "TypeScript", "Testing", "Performance"],
      },
      {
        role: "Senior Frontend Dev",
        years: "4–7 yrs",
        salary: "$130k–$160k",
        skills: ["Architecture", "Mentoring", "System Design"],
      },
      {
        role: "Staff Engineer",
        years: "7+ yrs",
        salary: "$160k–$220k",
        skills: ["Technical Strategy", "Cross-team Leadership"],
      },
    ],
  },
  {
    id: "fullstack-path",
    title: "Full Stack Track",
    color: "indigo",
    steps: [
      {
        role: "Junior Developer",
        years: "0–2 yrs",
        salary: "$65k–$95k",
        skills: ["JavaScript", "Node.js", "SQL", "React"],
      },
      {
        role: "Full Stack Engineer",
        years: "2–5 yrs",
        salary: "$100k–$150k",
        skills: ["TypeScript", "Docker", "Cloud", "APIs"],
      },
      {
        role: "Senior Full Stack Eng",
        years: "5–8 yrs",
        salary: "$150k–$190k",
        skills: ["System Design", "Tech Lead", "Architecture"],
      },
      {
        role: "Engineering Manager",
        years: "8+ yrs",
        salary: "$190k–$280k",
        skills: ["People Mgmt", "OKRs", "Hiring"],
      },
    ],
  },
  {
    id: "ml-path",
    title: "AI/ML Track",
    color: "purple",
    steps: [
      {
        role: "ML Engineer",
        years: "0–3 yrs",
        salary: "$90k–$140k",
        skills: ["Python", "scikit-learn", "SQL", "Statistics"],
      },
      {
        role: "Senior ML Engineer",
        years: "3–6 yrs",
        salary: "$140k–$190k",
        skills: ["PyTorch", "MLOps", "Model Deployment"],
      },
      {
        role: "ML Tech Lead",
        years: "6–9 yrs",
        salary: "$190k–$250k",
        skills: ["Research", "System Architecture", "Team Lead"],
      },
      {
        role: "Principal ML Engineer",
        years: "9+ yrs",
        salary: "$250k–$400k",
        skills: ["Company-wide ML Strategy", "Research Direction"],
      },
    ],
  },
];

const COLOR_MAP = {
  blue: {
    badge: "bg-blue-600",
    light: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  indigo: {
    badge: "bg-indigo-600",
    light: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-700/40",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  purple: {
    badge: "bg-purple-600",
    light: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-700/40",
    text: "text-purple-600 dark:text-purple-400",
  },
};

const PATH_COLORS = ["blue", "indigo", "purple", "emerald"];

function normalizePaths(paths, roles) {
  if (paths?.length) {
    return paths.map((p, i) => ({
      id: p.id || `path-${i}`,
      title: p.track || "Your career track",
      color: PATH_COLORS[i % PATH_COLORS.length],
      steps: (p.steps || []).map((s) => ({
        role: s.level,
        years: s.years,
        salary: "",
        skills: s.focus ? s.focus.split(/,\s*/) : [],
      })),
    }));
  }
  return CAREER_PATHS;
}

export default function CareerPath({ paths, roles }) {
  const navigate = useNavigate();
  const displayPaths = normalizePaths(paths, roles);

  return (
    <div className="space-y-8">
      {displayPaths.map((path) => {
        const c = COLOR_MAP[path.color];
        return (
          <div
            key={path.id}
            className={`rounded-2xl border ${c.border} ${c.light} p-6`}
          >
            <h3 className={`font-display font-bold text-lg mb-5 ${c.text}`}>
              {path.title}
            </h3>

            {/* Step progression */}
            <div className="flex flex-col lg:flex-row items-start lg:items-stretch gap-3">
              {path.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex lg:flex-col items-center gap-3 flex-1"
                >
                  {/* Step card */}
                  <div className="flex-1 w-full bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-white/8 shadow-sm">
                    {/* Step number */}
                    <div
                      className={`w-6 h-6 rounded-full ${c.badge} flex items-center justify-center mb-2`}
                    >
                      <span className="text-xs font-bold text-white">
                        {idx + 1}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1 leading-snug">
                      {step.role}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {step.years}
                    </p>
                    <p className={`text-sm font-bold mb-3 ${c.text}`}>
                      {step.salary}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1">
                      {step.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow between steps */}
                  {idx < path.steps.length - 1 && (
                    <ArrowRight
                      size={18}
                      className={`flex-shrink-0 ${c.text} hidden lg:block`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Avg time to {path.steps[path.steps.length - 1].role}:{" "}
                {path.steps[path.steps.length - 1].years}
              </p>
              <button
                onClick={() => navigate("/skills")}
                className={`text-sm font-semibold ${c.text} hover:underline flex items-center gap-1`}
              >
                <Star size={13} /> View skill roadmap
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
