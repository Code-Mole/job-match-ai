import { loadFilteredJobs, scoreJobsForUser } from "../utils/jobMatchHelper.js";

const DEFAULT_PROS = ["Growing demand", "Transferable skills", "Clear progression"];
const DEFAULT_CONS = ["Competitive market", "Requirements vary by employer"];

function roleFromJob(job, matchScore = null, userSkills = []) {
  const salMin = job.salaryMin || 45000;
  const salMax = job.salaryMax || 95000;
  const jobSkills = job.skills?.length ? job.skills : userSkills.slice(0, 8);

  return {
    id: job._id?.toString() || job.title.toLowerCase().replace(/\s+/g, "-"),
    title: job.title,
    category: job.industry || "General",
    description: (job.description || "Role based on current job market data.").slice(0, 300),
    salaryMin: salMin,
    salaryMax: salMax,
    salaryMid: Math.round((salMin + salMax) / 2) || 65000,
    demandTrend: job.demandTrend || "Stable",
    growthRate: job.demandTrend === "Increasing" ? "+12%" : "+6%",
    openRoles: 1200,
    minYears: job.yearsExp || 0,
    remote: !!job.remote,
    skills: jobSkills.slice(0, 12),
    pros: DEFAULT_PROS,
    cons: DEFAULT_CONS,
    adjacent: [],
    companies: [job.company].filter(Boolean),
    matchScore,
    source: "live",
  };
}

function roleFromCvTitle(title, user) {
  return {
    id: title.toLowerCase().replace(/\s+/g, "-"),
    title,
    category: "Your experience",
    description: `Career path aligned with your CV: ${title}.`,
    salaryMin: 40000,
    salaryMax: 95000,
    salaryMid: 65000,
    demandTrend: "Stable",
    growthRate: "+8%",
    openRoles: 900,
    minYears: user.yearsExp || 1,
    remote: true,
    skills: (user.skills || []).slice(0, 8),
    pros: ["Builds on your existing experience"],
    cons: ["Varies by region and employer"],
    adjacent: [],
    companies: [],
    source: "cv",
  };
}

function buildPathsFromRoles(roles, user) {
  const start = user?.cvRoles?.[0] || user?.headline || roles[0]?.title || "Current role";

  return roles.map((role, i) => ({
    id: role.id,
    track: role.category || "Career track",
    steps: [
      {
        level: start,
        years: "Now",
        focus: (user?.skills || []).slice(0, 4).join(", ") || "Core skills",
      },
      {
        level: i === 0 ? role.title : roles[i - 1]?.title || role.title,
        years: `${1 + i * 2}–${2 + i * 2} yrs`,
        focus: role.skills?.slice(0, 4).join(", ") || "Role-specific skills",
      },
      {
        level: role.title,
        years: `${3 + i * 2}+ yrs`,
        focus: "Leadership & specialization",
      },
    ],
  }));
}

export async function buildCareerInsights(user) {
  const jobs = await loadFilteredJobs({}, 120);
  let matches = [];

  if (user.skills?.length || user.cvText) {
    try {
      matches = await scoreJobsForUser(user, jobs, 40);
    } catch {
      matches = [];
    }
  }

  const topJobs = matches.length
    ? matches
        .map((m) => {
          const job = jobs.find((j) => j._id.toString() === String(m.job_id));
          return job ? { job, score: m.match_score } : null;
        })
        .filter(Boolean)
        .slice(0, 12)
    : jobs.slice(0, 8).map((job) => ({ job, score: null }));

  const dynamicRoles = topJobs.map(({ job, score }) =>
    roleFromJob(job, score, user.skills || []),
  );

  for (const title of user.cvRoles || []) {
    if (!dynamicRoles.find((r) => r.title.toLowerCase() === title.toLowerCase())) {
      dynamicRoles.push(roleFromCvTitle(title, user));
    }
  }

  const avgSalary =
    dynamicRoles.reduce((s, r) => s + (r.salaryMid || 0), 0) /
    Math.max(dynamicRoles.length, 1);

  return {
    roles: dynamicRoles,
    careerPaths: buildPathsFromRoles(dynamicRoles.slice(0, 4), user),
    marketSummary: {
      avgSalary: Math.round(avgSalary),
      topIndustries: [...new Set(dynamicRoles.map((r) => r.category).filter(Boolean))].slice(0, 5),
      skillDemand: [...new Set(dynamicRoles.flatMap((r) => r.skills))].slice(0, 15),
      matchCount: matches.length,
    },
    personalized: !!(user.skills?.length || user.cvText),
    userSkills: user.skills || [],
    topMatchScore: matches[0]?.match_score ?? null,
    recommendedTitles: dynamicRoles.slice(0, 5).map((r) => r.title),
  };
}
