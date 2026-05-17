
// /**
//  * Real-world job API aggregator.
//  * Primary:  Adzuna  (https://developer.adzuna.com — free tier: 250 req/month)
//  * Fallback: Remotive (https://remotive.com/api — completely free, remote-only)
//  * Cache:    MongoDB  (24-hour TTL to respect API limits)
//  *
//  * Sign up for Adzuna at: https://developer.adzuna.com/signup
//  * You get: app_id and app_key
//  */

// import axios from 'axios';
// import Job   from '../models/Job.js';

// const ADZUNA_BASE  = 'https://api.adzuna.com/v1/api/jobs'
// const REMOTIVE_BASE = 'https://remotive.com/api/remote-jobs'
// const CACHE_TTL_MS  = 24 * 60 * 60 * 1000 // 24 hours

// /* =========================
//    CATEGORY MAPPING (ALL JOBS)
// ========================= */
// const ADZUNA_MAP = {
//   all: "jobs",
//   software: "software engineer",
//   finance: "accountant",
//   healthcare: "nurse",
//   education: "teacher",
//   marketing: "marketing manager",
//   engineering: "mechanical engineer",
//   sales: "sales executive",
//   logistics: "driver",
//   hospitality: "hotel staff",
//   customerService: "customer service",
// };



// function normalizeJobType(type) {
//   if (!type) return "Full-time";

//   const t = type.toLowerCase();

//   if (t.includes("part")) return "Part-time";
//   if (t.includes("contract")) return "Contract";
//   if (t.includes("intern")) return "Internship";
//   if (t.includes("remote")) return "Remote";

//   return "Full-time";
// }

// function extractSkills(text = "") {
//   const lower = text.toLowerCase();

//   const SKILL_KEYWORDS = [
//     // =========================
//     // 💼 Soft Skills (ALL JOBS)
//     // =========================
//     "communication",
//     "teamwork",
//     "leadership",
//     "problem solving",
//     "time management",
//     "customer service",
//     "attention to detail",
//     "critical thinking",
//     "adaptability",
//     "organization",

//     // =========================
//     // 🧑‍💼 Business / Office Skills
//     // =========================
//     "excel",
//     "microsoft office",
//     "data entry",
//     "accounting",
//     "bookkeeping",
//     "sales",
//     "marketing",
//     "project management",
//     "administration",
//     "human resources",
//     "recruitment",

//     // =========================
//     // 🏥 Healthcare
//     // =========================
//     "nursing",
//     "patient care",
//     "medical",
//     "pharmacy",
//     "healthcare",

//     // =========================
//     // 🏫 Education
//     // =========================
//     "teaching",
//     "lesson planning",
//     "training",
//     "tutoring",

//     // =========================
//     // 🚚 Logistics / Manual Work
//     // =========================
//     "driving",
//     "warehouse",
//     "delivery",
//     "inventory",
//     "logistics",

//     // =========================
//     // 🧑‍💻 Tech (still included but not dominant)
//     // =========================
//     "react",
//     "vue",
//     "angular",
//     "typescript",
//     "javascript",
//     "python",
//     "node.js",
//     "java",
//     "go",
//     "rust",
//     "docker",
//     "kubernetes",
//     "aws",
//     "gcp",
//     "azure",
//     "postgresql",
//     "mongodb",
//     "redis",
//     "graphql",
//     "rest",
//     "machine learning",
//     "pytorch",
//     "tensorflow",
//     "nlp",
//     "figma",
//     "css",
//     "html",
//     "tailwind",
//   ];

//   return SKILL_KEYWORDS.filter((skill) => lower.includes(skill.toLowerCase()));
// }

// function createFingerprint(job) {
//   return (
//     job.title?.toLowerCase().trim() +
//     "|" +
//     job.company?.toLowerCase().trim() +
//     "|" +
//     job.location?.toLowerCase().trim()
//   );
// }

// /* =========================
//    ADZUNA NORMALIZER
// ========================= */

// function normaliseAdzuna(job) {
//   const salMin = job.salary_min || 0;
//   const salMax = job.salary_max || 0;

//   const salary =
//     salMin && salMax
//       ? `$${Math.round(salMin / 1000)}k–$${Math.round(salMax / 1000)}k`
//       : salMax
//         ? `Up to $${Math.round(salMax / 1000)}k`
//         : "Salary not specified";

//   const description = (job.description || "")
//     .replace(/<[^>]*>/g, "")
//     .slice(0, 5000);

//   return {
//     externalId: `adzuna-${job.id}`,
//     fingerprint: createFingerprint({
//       title: job.title,
//       company: job.company?.display_name,
//       location: job.location?.display_name,
//     }),
//     title: job.title || "Untitled Job",
//     company: job.company?.display_name || "Unknown Company",
//     location: job.location?.display_name || "Unknown",
//     type: normalizeJobType(job.contract_time),

//     remote:
//       description.toLowerCase().includes("remote") ||
//       description.toLowerCase().includes("work from home"),

//     salaryMin: salMin,
//     salaryMax: salMax,
//     salary,
//     description: description || "No description available",
//     skills: extractSkills(description),

//     requirements: [],
//     responsibilities: [],
//     level: "Mid",
//     yearsExp: 0,
//     industry: job.category?.label || "",
//     applyUrl: job.redirect_url || "",
//     demandTrend: "Stable",
//     isActive: true,
//     postedAt: job.created ? new Date(job.created) : new Date(),
//     source: "adzuna",
//   };
// }

// // ── Normalise Remotive job → our Job schema ───────────────────────────────────
// function normaliseRemotive(job) {
//   const desc  = (job.description || '').replace(/<[^>]*>/g, '')
//   const lower = desc.toLowerCase()
//   const SKILL_KEYWORDS = [
//     'React','Vue','Angular','TypeScript','JavaScript','Python','Node.js',
//     'Java','Go','Rust','Docker','Kubernetes','AWS','GCP','Azure',
//     'PostgreSQL','MongoDB','Redis','GraphQL','Machine Learning',
//     'PyTorch','TensorFlow','CSS','HTML',
//   ]
//   const skills = SKILL_KEYWORDS.filter(s => lower.includes(s.toLowerCase()))

//   return {
//     externalId:   `remotive-${job.id}`,
//      fingerprint: createFingerprint({
//       title: job.title,
//       company: job.company_name,
//       location: "remote",
//     }),
//     title:         job.title,
//     company:       job.company_name || 'Unknown Company',
//     location:     'Remote',
//     type:         'Full-time',
//     remote:        true,
//     salaryMin:     0,
//     salaryMax:     0,
//     salary:        job.salary || 'Salary not specified',
//     description:   desc,
//     skills,
//     requirements:  [],
//     responsibilities: [],
//     level:         'Mid',
//     yearsExp:      0,
//     industry:      job.category || '',
//     applyUrl:      job.url || '',
//     demandTrend:   'Stable',
//     isActive:      true,
//     postedAt:      new Date(job.publication_date || Date.now()),
//     source:        'remotive',
//   }
// }

// /* =========================
//    FETCH ADZUNA
// ========================= */

// async function fetchAdzuna(query = "jobs", country = "", pages = 3) {
//   const APP_ID = process.env.ADZUNA_APP_ID;
//   const APP_KEY = process.env.ADZUNA_APP_KEY;

//   if (!APP_ID || !APP_KEY) {
//     console.warn("Missing Adzuna credentials");
//     return [];
//   }

//   const jobs = [];

//   for (let page = 1; page <= pages; page++) {
//     try {
//       const url = `${ADZUNA_BASE}/${country}/search/${page}`;

//       const { data } = await axios.get(url, {
//         params: {
//           app_id: APP_ID,
//           app_key: APP_KEY,
//           what: query,
//           results_per_page: 20,
//         },
//         timeout: 10000,
//       });

//       const results = (data.results || []).map(normaliseAdzuna);
//       jobs.push(...results);
//     } catch (err) {
//       console.error("Adzuna fetch failed:", err.message);
//     }
//   }

//   console.log(`✅ Adzuna fetched ${jobs.length} jobs`);
//   return jobs;
// }

// // ── Fetch from Remotive ───────────────────────────────────────────────────────
// async function fetchRemotive() {
//   try {
//     const { data } = await axios.get(REMOTIVE_BASE, {
//       timeout: 10000,
//     });

//     const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];

//     const jobs = rawJobs.map(normaliseRemotive);

//     console.log("━━━━━━━━━━━━━━━━━━━━━━");
//     console.log("🌍 ALL Remotive Jobs");
//     console.log("━━━━━━━━━━━━━━━━━━━━━━");
//     console.log("Jobs received:", rawJobs.length);
//     console.log("Jobs mapped:", jobs.length);

//     return jobs;
//   } catch (err) {
//     console.error("❌ Remotive fetch failed");
//     console.error("Message:", err.message);

//     return [];
//   }
// }

// /* =========================
//    UPSERT JOBS (FAST BULK)
// ========================= */

// async function upsertJobs(jobs) {
//   const bulkOps = jobs.map((job) => ({
//     updateOne: {
//       filter: { externalId: job.externalId },
//       update: { $set: job },
//       upsert: true,
//     },
//   }));

//   const result = await Job.bulkWrite(bulkOps);
//   return result.upsertedCount + result.modifiedCount;
// }

// // // ── Upsert jobs into MongoDB ──────────────────────────────────────────────────
// // async function upsertJobs(jobs) {
// //   let saved = 0
// //   for (const job of jobs) {
// //     try {
// //       await Job.findOneAndUpdate(
// //         { externalId: job.externalId },
// //         { $set: job },
// //         { upsert: true, new: true }
// //       )
// //       saved++
// //     } catch (err) {
// //       console.error('Upsert failed for', job.title, ':', err.message)
// //     }
// //   }
// //   return saved
// // }


// /* =========================
//    MAIN SYNC FUNCTION
// ========================= */

// async function syncJobs(force = false, category = "all") {
//   try {
//     console.log("🚀 Sync started...");

//     const recentJob = await Job.findOne({
//       source: { $in: ["adzuna", "remotive"] },
//     })
//       .sort({ postedAt: -1 })
//       .lean();

//     // if (!force && recentJob?.postedAt) {
//     //   const age = Date.now() - new Date(recentJob.postedAt).getTime();

//     //   if (age < CACHE_TTL_MS) {
//     //     console.log("Using cached jobs");

//     //     return {
//     //       skipped: true,
//     //       cachedCount: await Job.countDocuments({ isActive: true }),
//     //     };
//     //   }
//     // }

//     const keyword = ADZUNA_MAP[category] || category || "jobs";
    
  

//     const [adzunaJobs, remotiveJobs] = await Promise.all([
//       fetchAdzuna(keyword,"us"),
//       fetchRemotive(),
//     ]);

//     const merged = [...adzunaJobs, ...remotiveJobs];

//     const uniqueMap = new Map();

//     for (const job of merged) {
//       if (!uniqueMap.has(job.fingerprint)) {
//         uniqueMap.set(job.fingerprint, job);
//       }
//     }

//     const allJobs = [...uniqueMap.values()];

//     console.log("Adzuna:", adzunaJobs.length);
//     console.log("Remotive:", remotiveJobs.length);

//     if (allJobs.length === 0) {
//       return {
//         synced: 0,
//         total: await Job.countDocuments(),
//       };
//     }

//     const saved = await upsertJobs(allJobs);

//     const total = await Job.countDocuments({ isActive: true });

//     console.log(`✅ Sync complete: ${saved} saved`);

//     return {
//       synced: saved,
//       total,
//     };
//   } catch (err) {
//     console.error("Job sync failed:", err.message);

//     return {
//       synced: 0,
//       total: 0,
//     };
//   }
// }


// // // ── Main: fetch + cache ───────────────────────────────────────────────────────
// // async function syncJobs(force = false) {
// //   // Check if we've synced recently
// //   const recentJob = await Job.findOne({ source: { $in: ['adzuna','remotive'] } })
// //     .sort({ updatedAt: -1 })
// //     .lean()

// //   if (!force && recentJob) {
// //     const age = Date.now() - new Date(recentJob.updatedAt).getTime()
// //     if (age < CACHE_TTL_MS) {
// //       console.log(`⏭️  Job sync skipped — cache is ${Math.round(age / 3600000)}h old`)
// //       return { skipped: true, cachedCount: await Job.countDocuments({ isActive: true }) }
// //     }
// //   }

// //   console.log('🔄 Syncing jobs from external APIs…')

// //   // Fetch from all sources in parallel
// //   const [adzunaJobs, remotiveJobs] = await Promise.all([
// //     fetchAdzuna('software engineer', 'us', 3),
// //     fetchRemotive('software-dev'),
// //   ])

// //   const allJobs = [...adzunaJobs, ...remotiveJobs]

// //   if (allJobs.length === 0) {
// //     console.warn('⚠️  No jobs fetched from any source.')
// //     return { synced: 0, total: await Job.countDocuments({ isActive: true }) }
// //   }

// //   const saved = await upsertJobs(allJobs)
// //   const total = await Job.countDocuments({ isActive: true })

// //   console.log(`✅ Job sync complete: ${saved} upserted, ${total} total in DB`)
// //   return { synced: saved, total }
// // }

// export { syncJobs, fetchAdzuna, fetchRemotive }



/**
 * Real-world job API aggregator.
 * Primary:  Adzuna
 * Fallback: Remotive
 * Cache:    MongoDB
 */

import axios from "axios";
import Job from "../models/Job.js";

const ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs";
const REMOTIVE_BASE = "https://remotive.com/api/remote-jobs";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Diverse search terms so Adzuna results span sectors (not tech-only).
 * Each query returns different result sets; we merge them and only dedupe by
 * stable listing id (`externalId`) so the same posted role is not stored twice.
 */
const DEFAULT_BROAD_QUERIES = [
  "jobs",
  "retail",
  "warehouse",
  "nurse",
  "teacher",
  "accountant",
  "sales",
  "driver",
  "customer service",
  "administrator",
  "hospitality",
  "construction",
  "care assistant",
  "electrician",
  "plumber",
  "software engineer",
];

/* =========================
   CATEGORY MAPPING
========================= */

const ADZUNA_MAP = {
  all: null, // uses multi-query broad sync (see syncJobs)
  software: "software engineer",
  finance: "accountant",
  healthcare: "nurse",
  education: "teacher",
  marketing: "marketing manager",
  engineering: "mechanical engineer",
  sales: "sales executive",
  logistics: "driver",
  hospitality: "hotel staff",
  customerService: "customer service",
};

function parseExtraQueries() {
  const raw = process.env.ADZUNA_EXTRA_QUERIES;
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((q) => q.trim())
    .filter(Boolean);
}

function getBroadQueries() {
  const extra = parseExtraQueries();
  const combined = [...DEFAULT_BROAD_QUERIES, ...extra];
  return [...new Set(combined)];
}

/* =========================
   HELPERS
========================= */

function normalizeJobType(type) {
  if (!type) return "Full-time";

  const t = type.toLowerCase();

  if (t.includes("part")) return "Part-time";
  if (t.includes("contract")) return "Contract";
  if (t.includes("intern")) return "Internship";
  if (t.includes("remote")) return "Remote";

  return "Full-time";
}

function extractSkills(text = "") {
  const lower = text.toLowerCase();

  const SKILL_KEYWORDS = [
    // Soft Skills
    "communication",
    "teamwork",
    "leadership",
    "problem solving",
    "time management",
    "customer service",
    "attention to detail",
    "critical thinking",
    "adaptability",
    "organization",

    // Business
    "excel",
    "microsoft office",
    "data entry",
    "accounting",
    "bookkeeping",
    "sales",
    "marketing",
    "project management",
    "administration",
    "human resources",
    "recruitment",

    // Healthcare
    "nursing",
    "patient care",
    "medical",
    "pharmacy",
    "healthcare",

    // Education
    "teaching",
    "lesson planning",
    "training",
    "tutoring",

    // Logistics
    "driving",
    "warehouse",
    "delivery",
    "inventory",
    "logistics",

    // Tech
    "react",
    "vue",
    "angular",
    "typescript",
    "javascript",
    "python",
    "node.js",
    "java",
    "go",
    "rust",
    "docker",
    "kubernetes",
    "aws",
    "gcp",
    "azure",
    "postgresql",
    "mongodb",
    "redis",
    "graphql",
    "rest",
    "machine learning",
    "pytorch",
    "tensorflow",
    "nlp",
    "figma",
    "css",
    "html",
    "tailwind",
  ];

  return SKILL_KEYWORDS.filter((skill) =>
    lower.includes(skill.toLowerCase())
  );
}

/** Pull requirement / responsibility bullets from job description HTML/text. */
function extractRequirementsAndResponsibilities(text = "") {
  const plain = (text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const requirements = [];
  const responsibilities = [];
  const seen = new Set();

  const addUnique = (arr, item) => {
    const t = item.trim().slice(0, 280);
    if (t.length < 8 || seen.has(t.toLowerCase())) return;
    seen.add(t.toLowerCase());
    arr.push(t);
  };

  const reqBlock = plain.match(
    /(?:requirements?|qualifications?|what you(?:'ll| will) need|must have|essential)[:\s]*([\s\S]{0,2500})/i,
  );
  const respBlock = plain.match(
    /(?:responsibilities|duties|what you(?:'ll| will) do|role overview|key tasks)[:\s]*([\s\S]{0,2500})/i,
  );

  const bulletFrom = (block) => {
    if (!block) return;
    const bullets = block.match(/(?:^|[\n•])\s*[-•*]\s*([^•\n]{10,220})/g) || [];
    for (const b of bullets) {
      addUnique(requirements, b.replace(/^[\s\-•*]+/, ""));
    }
    const sentences = block.split(/(?<=[.!?])\s+/).slice(0, 12);
    for (const s of sentences) {
      if (/\b(required|must|minimum|experience|degree|certification|proficient)\b/i.test(s)) {
        addUnique(requirements, s);
      }
    }
  };

  bulletFrom(reqBlock?.[1]);
  bulletFrom(respBlock?.[1]);

  if (respBlock?.[1]) {
    const respBullets = respBlock[1].match(/(?:^|[\n•])\s*[-•*]\s*([^•\n]{10,220})/g) || [];
    for (const b of respBullets) {
      addUnique(responsibilities, b.replace(/^[\s\-•*]+/, ""));
    }
  }

  if (requirements.length === 0) {
    const skillHits = extractSkills(plain);
    for (const s of skillHits.slice(0, 8)) {
      addUnique(requirements, `Experience with ${s}`);
    }
    const expMatch = plain.match(
      /(\d+\+?\s*years?\s+(?:of\s+)?[\w\s]{3,40}experience[\w\s,.]{0,80})/gi,
    );
    for (const e of (expMatch || []).slice(0, 4)) {
      addUnique(requirements, e.trim());
    }
  }

  if (responsibilities.length === 0 && plain.length > 80) {
    const lead = plain.slice(0, 320).split(/(?<=[.!?])\s+/)[0];
    if (lead?.length > 20) addUnique(responsibilities, lead);
  }

  return {
    requirements: requirements.slice(0, 12),
    responsibilities: responsibilities.slice(0, 8),
  };
}

/* =========================
   NORMALIZE ADZUNA
========================= */

function normaliseAdzuna(job) {
  const salMin = job.salary_min || 0;
  const salMax = job.salary_max || 0;

  const salary =
    salMin && salMax
      ? `$${Math.round(salMin / 1000)}k–$${Math.round(salMax / 1000)}k`
      : salMax
      ? `Up to $${Math.round(salMax / 1000)}k`
      : "Salary not specified";

  const description = (job.description || "")
    .replace(/<[^>]*>/g, "")
    .slice(0, 5000);

  return {
    externalId: `adzuna-${job.id}`,

    // UNIQUE fingerprint
    fingerprint: `adzuna-${job.id}`,

    title: job.title || "Untitled Job",

    company: job.company?.display_name || "Unknown Company",

    location: job.location?.display_name || "Unknown",

    type: normalizeJobType(job.contract_time),

    remote:
      description.toLowerCase().includes("remote") ||
      description.toLowerCase().includes("work from home"),

    salaryMin: salMin,
    salaryMax: salMax,
    salary,

    description: description || "No description available",

    skills: extractSkills(description),

    ...extractRequirementsAndResponsibilities(description),

    level: inferLevel(description),

    yearsExp: inferYearsExp(description),

    industry: job.category?.label || "",

    applyUrl: job.redirect_url || "",

    demandTrend: "Stable",

    isActive: true,

    postedAt: job.created ? new Date(job.created) : new Date(),

    source: "adzuna",
  };
}

/* =========================
   NORMALIZE REMOTIVE
========================= */

function normaliseRemotive(job) {
  const desc = (job.description || "")
    .replace(/<[^>]*>/g, "")
    .slice(0, 5000);

  return {
    externalId: `remotive-${job.id}`,

    // CRITICAL FIX:
    // Use UNIQUE job ID instead of title/company/location
    fingerprint: `remotive-${job.id}`,

    title: job.title || "Untitled Job",

    company: job.company_name || "Unknown Company",

    location: job.candidate_required_location || "Remote",

    type: "Full-time",

    remote: true,

    salaryMin: 0,

    salaryMax: 0,

    salary: job.salary || "Salary not specified",

    description: desc,

    skills: extractSkills(desc),

    ...extractRequirementsAndResponsibilities(desc),

    level: inferLevel(desc),

    yearsExp: inferYearsExp(desc),

    industry: job.category || "",

    applyUrl: job.url || "",

    demandTrend: "Stable",

    isActive: true,

    postedAt: new Date(job.publication_date || Date.now()),

    source: "remotive",
  };
}

function inferLevel(text = "") {
  const t = text.toLowerCase();
  if (/\b(senior|sr\.|lead|principal|staff)\b/.test(t)) return "Senior";
  if (/\b(junior|jr\.|entry|graduate|intern)\b/.test(t)) return "Junior";
  if (/\b(mid|intermediate)\b/.test(t)) return "Mid";
  return "Mid";
}

function inferYearsExp(text = "") {
  const m = text.match(/(\d+)\+?\s*years?/i);
  return m ? parseInt(m[1], 10) : 0;
}

/* =========================
   FETCH ADZUNA
========================= */

async function fetchAdzuna(query = "jobs", country = "us", pages = 3) {
  const APP_ID = process.env.ADZUNA_APP_ID;
  const APP_KEY = process.env.ADZUNA_APP_KEY;

  if (!APP_ID || !APP_KEY) {
    console.warn("❌ Missing Adzuna credentials");
    return [];
  }

  const jobs = [];
  const perPage = Math.min(
    50,
    Math.max(1, parseInt(process.env.ADZUNA_RESULTS_PER_PAGE || "50", 10)),
  );

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `${ADZUNA_BASE}/${country}/search/${page}`;

      const params = {
        app_id: APP_ID,
        app_key: APP_KEY,
        results_per_page: perPage,
      };
      if (query && String(query).trim()) {
        params.what = query.trim();
      }

      const { data } = await axios.get(url, {
        params,
        timeout: 15000,
      });

      const results = (data.results || []).map(normaliseAdzuna);

      jobs.push(...results);

      console.log(
        `✅ Adzuna "${query || "(general)"}" page ${page}: ${results.length} jobs`,
      );

      if (!results.length) break;
    } catch (err) {
      console.error(`❌ Adzuna page ${page} failed (${query}): ${err.message}`);
    }
  }

  return jobs;
}

/**
 * Fetch Adzuna across many sector queries in parallel so listings are not tech-skewed.
 */
async function fetchAdzunaMultiSector(country, pagesPerQuery) {
  const queries = getBroadQueries();

  const batches = await Promise.all(
    queries.map((q) => fetchAdzuna(q, country, pagesPerQuery)),
  );

  const byId = new Map();
  for (const batch of batches) {
    for (const job of batch) {
      byId.set(job.externalId, job);
    }
  }

  const merged = [...byId.values()];
  console.log(
    `✅ Adzuna multi-sector: ${queries.length} queries → ${merged.length} unique listings`,
  );
  return merged;
}

/* =========================
   FETCH REMOTIVE
========================= */

async function fetchRemotive() {
  try {
    const { data } = await axios.get(REMOTIVE_BASE, {
      timeout: 15000,
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🌍 REMOTIVE RESPONSE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━");

    console.log("Job count:", data["job-count"]);

    const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];

    console.log("Raw jobs:", rawJobs.length);

    const jobs = rawJobs.map(normaliseRemotive);

    console.log("Mapped jobs:", jobs.length);

    return jobs;
  } catch (err) {
    console.error("❌ Remotive fetch failed");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error("Message:", err.message);
    }

    return [];
  }
}

function jobFingerprint(job) {
  if (job.fingerprint) return job.fingerprint.toLowerCase().trim();
  return `${(job.title || "").toLowerCase().trim()}|${(job.company || "").toLowerCase().trim()}|${(job.location || "").toLowerCase().trim()}`;
}

/**
 * Return only jobs that are not already stored (by externalId or title/company/location).
 */
async function filterNewJobs(jobs) {
  if (!jobs.length) return { newJobs: [], skipped: 0 };

  const externalIds = jobs.map((j) => j.externalId).filter(Boolean);
  const fingerprints = jobs.map(jobFingerprint).filter(Boolean);
  const orClauses = [];
  if (externalIds.length) orClauses.push({ externalId: { $in: externalIds } });
  if (fingerprints.length) orClauses.push({ fingerprint: { $in: fingerprints } });

  if (!orClauses.length) return { newJobs: jobs, skipped: 0 };

  const existing = await Job.find({ $or: orClauses })
    .select("externalId fingerprint title company location")
    .lean();

  const seenIds = new Set(existing.map((e) => e.externalId).filter(Boolean));
  const seenFp = new Set(
    existing.map((e) =>
      e.fingerprint ||
      `${(e.title || "").toLowerCase().trim()}|${(e.company || "").toLowerCase().trim()}|${(e.location || "").toLowerCase().trim()}`,
    ),
  );

  const newJobs = [];
  for (const job of jobs) {
    const fp = jobFingerprint(job);
    if (job.externalId && seenIds.has(job.externalId)) continue;
    if (fp && seenFp.has(fp)) continue;
    newJobs.push(job);
    if (job.externalId) seenIds.add(job.externalId);
    if (fp) seenFp.add(fp);
  }

  return { newJobs, skipped: jobs.length - newJobs.length };
}

/* =========================
   INSERT NEW JOBS ONLY
========================= */

async function insertNewJobs(jobs) {
  if (!jobs.length) return 0;

  try {
    const result = await Job.insertMany(jobs, { ordered: false });
    console.log(`💾 Inserted ${result.length} new jobs`);
    return result.length;
  } catch (err) {
    if (err.code === 11000 || err.writeErrors) {
      const inserted = err.insertedDocs?.length ?? 0;
      console.warn(`⚠️ Partial insert: ${inserted} jobs (${err.writeErrors?.length || 0} duplicates skipped)`);
      return inserted;
    }
    console.error("❌ Job insert failed", err.message);
    return 0;
  }
}

/* =========================
   MAIN SYNC FUNCTION
========================= */

async function syncJobs(force = false, category = "all") {
  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 JOB SYNC STARTED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━");

    const recentJob = await Job.findOne({
      source: { $in: ["adzuna", "remotive"] },
    })
      .sort({ postedAt: -1 })
      .lean();

    void recentJob;
    void force;
    void CACHE_TTL_MS;

    const country = (process.env.ADZUNA_COUNTRY || "us").toLowerCase();
    const pagesPerQuery = Math.min(
      5,
      Math.max(1, parseInt(process.env.ADZUNA_PAGES_PER_QUERY || "2", 10)),
    );

    const mapped = ADZUNA_MAP[category];
    const useBroad =
      category === "all" ||
      mapped === null ||
      (typeof category === "string" && category.trim() === "");

    console.log(
      useBroad
        ? `Adzuna mode: multi-sector (${pagesPerQuery} page(s) per query), country=${country}`
        : `Adzuna mode: single query "${mapped || category}"`,
    );

    const [adzunaJobs, remotiveJobs] = await Promise.all([
      useBroad
        ? fetchAdzunaMultiSector(country, pagesPerQuery)
        : fetchAdzuna(mapped || category || "jobs", country, pagesPerQuery + 1),
      fetchRemotive(),
    ]);

    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 FETCH RESULTS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━");

    console.log("Adzuna jobs:", adzunaJobs.length);
    console.log("Remotive jobs:", remotiveJobs.length);

    const merged = [...adzunaJobs, ...remotiveJobs];

    console.log("Merged jobs (pre DB-upsert):", merged.length);

    // Dedupe only by provider listing id so two APIs may both list a similar role
    // with different ids (kept as separate rows). Same id never upserts twice.
    const uniqueMap = new Map();

    for (const job of merged) {
      if (!job.externalId) continue;
      uniqueMap.set(job.externalId, job);
    }

    const allJobs = [...uniqueMap.values()];

    console.log("Unique externalIds:", allJobs.length);

    if (allJobs.length === 0) {
      console.warn("⚠️ No jobs fetched");

      return {
        synced: 0,
        skipped: 0,
        total: await Job.countDocuments(),
      };
    }

    const { newJobs, skipped } = await filterNewJobs(allJobs);
    console.log(`New jobs to insert: ${newJobs.length} (skipped ${skipped} already in DB)`);

    const saved = await insertNewJobs(newJobs);

    // Backfill requirements on older rows that were synced before extraction existed
    const stale = await Job.find({
      isActive: true,
      $or: [{ requirements: { $size: 0 } }, { requirements: { $exists: false } }],
    })
      .limit(300)
      .lean();

    let backfilled = 0;
    for (const row of stale) {
      const { requirements, responsibilities } =
        extractRequirementsAndResponsibilities(row.description || "");
      if (!requirements.length && !responsibilities.length) continue;
      await Job.updateOne(
        { _id: row._id },
        { $set: { requirements, responsibilities } },
      );
      backfilled++;
    }
    if (backfilled) console.log(`📋 Backfilled requirements on ${backfilled} jobs`);

    const total = await Job.countDocuments({
      isActive: true,
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ SYNC COMPLETE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━");

    console.log("Saved:", saved);
    console.log("Total DB jobs:", total);

    return {
      synced: saved,
      skipped,
      total,
    };
  } catch (err) {
    console.error("❌ Job sync failed");
    console.error(err);

    return {
      synced: 0,
      total: 0,
    };
  }
}

export {
  syncJobs,
  fetchAdzuna,
  fetchRemotive,
};