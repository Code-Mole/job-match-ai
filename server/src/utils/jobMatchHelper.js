import axios from "axios";
import Job from "../models/Job.js";

const AI_URL = () => process.env.AI_SERVICE_URL || "http://localhost:8000";

export function buildJobFilter(query = {}) {
  const { search, location, type, remote, level, salaryMin, salaryMax } = query;
  const filter = { isActive: true };

  if (search) filter.$text = { $search: search };
  if (location) filter.location = { $regex: location, $options: "i" };
  if (type) filter.type = type;
  if (remote === "true" || remote === true) filter.remote = true;
  if (level) filter.level = level;

  if (salaryMin || salaryMax) {
    const salaryParts = [];
    if (salaryMin) salaryParts.push({ salaryMax: { $gte: Number(salaryMin) } });
    if (salaryMax) salaryParts.push({ salaryMin: { $lte: Number(salaryMax) } });
    filter.$and = [...(filter.$and || []), ...salaryParts];
  }

  return filter;
}

export async function scoreJobsForUser(user, jobs, topN) {
  if (!jobs.length) return [];
  if (!user.skills?.length && !user.cvText) return [];

  const limit = topN ?? Math.min(jobs.length, 100);

  try {
    await axios.post(`${AI_URL()}/load-jobs`, { jobs }, { timeout: 120000 });
  } catch {
    /* non-fatal */
  }

  const { data } = await axios.post(
    `${AI_URL()}/match`,
    {
      skills: user.skills || [],
      years_exp: user.yearsExp || 0,
      cv_text: user.cvText || "",
      strengths: user.skillStrengths || {},
      cv_roles: user.cvRoles || [],
      top_n: limit,
    },
    { timeout: 120000 },
  );

  return data.matches || [];
}

export async function loadFilteredJobs(query, max = 200) {
  const filter = buildJobFilter(query);
  return Job.find(filter).sort({ postedAt: -1 }).limit(max).lean();
}
