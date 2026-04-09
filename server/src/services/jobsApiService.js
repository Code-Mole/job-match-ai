/**
 * Real-world job API aggregator.
 * Primary:  Adzuna  (https://developer.adzuna.com — free tier: 250 req/month)
 * Fallback: Remotive (https://remotive.com/api — completely free, remote-only)
 * Cache:    MongoDB  (24-hour TTL to respect API limits)
 *
 * Sign up for Adzuna at: https://developer.adzuna.com/signup
 * You get: app_id and app_key
 */

import axios from 'axios'
import Job   from '../models/Job.js'

const ADZUNA_BASE  = 'https://api.adzuna.com/v1/api/jobs'
const REMOTIVE_BASE = 'https://remotive.com/api/remote-jobs'
const CACHE_TTL_MS  = 24 * 60 * 60 * 1000 // 24 hours

// ── Normalise Adzuna job → our Job schema ─────────────────────────────────────
function normaliseAdzuna(job) {
  const salMin = job.salary_min || 0
  const salMax = job.salary_max || 0
  const salary = salMin && salMax
    ? `$${Math.round(salMin / 1000)}k–$${Math.round(salMax / 1000)}k`
    : salMax ? `Up to $${Math.round(salMax / 1000)}k`
    : 'Salary not specified'

  // Extract skills from description using simple keyword matching
  const desc  = (job.description || '').toLowerCase()
  const SKILL_KEYWORDS = [
    'React','Vue','Angular','TypeScript','JavaScript','Python','Node.js',
    'Java','Go','Rust','Docker','Kubernetes','AWS','GCP','Azure',
    'PostgreSQL','MongoDB','Redis','GraphQL','REST','Machine Learning',
    'PyTorch','TensorFlow','NLP','Figma','CSS','HTML','Tailwind',
  ]
  const skills = SKILL_KEYWORDS.filter(s => desc.includes(s.toLowerCase()))

  return {
    externalId:   `adzuna-${job.id}`,
    title:         job.title,
    company:       job.company?.display_name || 'Unknown Company',
    location:      job.location?.display_name || 'Unknown',
    type:          'Full-time',
    remote:        desc.includes('remote') || desc.includes('work from home'),
    salaryMin:     salMin,
    salaryMax:     salMax,
    salary,
    description:   job.description?.replace(/<[^>]*>/g, '') || '',
    skills,
    requirements:  [],
    responsibilities: [],
    level:         'Mid',
    yearsExp:      0,
    industry:      job.category?.label || '',
    applyUrl:      job.redirect_url || '',
    demandTrend:   'Stable',
    isActive:      true,
    postedAt:      new Date(job.created || Date.now()),
    source:        'adzuna',
  }
}

// ── Normalise Remotive job → our Job schema ───────────────────────────────────
function normaliseRemotive(job) {
  const desc  = (job.description || '').replace(/<[^>]*>/g, '')
  const lower = desc.toLowerCase()
  const SKILL_KEYWORDS = [
    'React','Vue','Angular','TypeScript','JavaScript','Python','Node.js',
    'Java','Go','Rust','Docker','Kubernetes','AWS','GCP','Azure',
    'PostgreSQL','MongoDB','Redis','GraphQL','Machine Learning',
    'PyTorch','TensorFlow','CSS','HTML',
  ]
  const skills = SKILL_KEYWORDS.filter(s => lower.includes(s.toLowerCase()))

  return {
    externalId:   `remotive-${job.id}`,
    title:         job.title,
    company:       job.company_name || 'Unknown Company',
    location:     'Remote',
    type:         'Full-time',
    remote:        true,
    salaryMin:     0,
    salaryMax:     0,
    salary:        job.salary || 'Salary not specified',
    description:   desc,
    skills,
    requirements:  [],
    responsibilities: [],
    level:         'Mid',
    yearsExp:      0,
    industry:      job.category || '',
    applyUrl:      job.url || '',
    demandTrend:   'Stable',
    isActive:      true,
    postedAt:      new Date(job.publication_date || Date.now()),
    source:        'remotive',
  }
}

// ── Fetch from Adzuna ─────────────────────────────────────────────────────────
async function fetchAdzuna(query = 'software developer', country = 'us', pages = 3) {
  const APP_ID  = process.env.ADZUNA_APP_ID
  const APP_KEY = process.env.ADZUNA_APP_KEY

  if (!APP_ID || !APP_KEY) {
    console.warn('⚠️  Adzuna credentials not set — skipping Adzuna fetch.')
    return []
  }

  const jobs = []
  for (let page = 1; page <= pages; page++) {
    try {
      const { data } = await axios.get(`${ADZUNA_BASE}/${country}/search/${page}`, {
        params: {
          app_id:         APP_ID,
          app_key:        APP_KEY,
          results_per_page: 20,
          what:           query,
          content_type:   'application/json',
        },
        timeout: 10000,
      })
      jobs.push(...(data.results || []).map(normaliseAdzuna))
    } catch (err) {
      console.error(`Adzuna page ${page} failed:`, err.message)
      break
    }
  }

  console.log(`✅ Adzuna: fetched ${jobs.length} jobs`)
  return jobs
}

// ── Fetch from Remotive ───────────────────────────────────────────────────────
async function fetchRemotive(category = '') {
  try {
    const params = { limit: 50 }
    if (category) params.category = category

    const { data } = await axios.get(REMOTIVE_BASE, { params, timeout: 10000 })
    const jobs = (data.jobs || []).map(normaliseRemotive)
    console.log(`✅ Remotive: fetched ${jobs.length} jobs`)
    return jobs
  } catch (err) {
    console.error('Remotive fetch failed:', err.message)
    return []
  }
}

// ── Upsert jobs into MongoDB ──────────────────────────────────────────────────
async function upsertJobs(jobs) {
  let saved = 0
  for (const job of jobs) {
    try {
      await Job.findOneAndUpdate(
        { externalId: job.externalId },
        { $set: job },
        { upsert: true, new: true }
      )
      saved++
    } catch (err) {
      console.error('Upsert failed for', job.title, ':', err.message)
    }
  }
  return saved
}

// ── Main: fetch + cache ───────────────────────────────────────────────────────
async function syncJobs(force = false) {
  // Check if we've synced recently
  const recentJob = await Job.findOne({ source: { $in: ['adzuna','remotive'] } })
    .sort({ updatedAt: -1 })
    .lean()

  if (!force && recentJob) {
    const age = Date.now() - new Date(recentJob.updatedAt).getTime()
    if (age < CACHE_TTL_MS) {
      console.log(`⏭️  Job sync skipped — cache is ${Math.round(age / 3600000)}h old`)
      return { skipped: true, cachedCount: await Job.countDocuments({ isActive: true }) }
    }
  }

  console.log('🔄 Syncing jobs from external APIs…')

  // Fetch from all sources in parallel
  const [adzunaJobs, remotiveJobs] = await Promise.all([
    fetchAdzuna('software engineer', 'us', 3),
    fetchRemotive('software-dev'),
  ])

  const allJobs = [...adzunaJobs, ...remotiveJobs]

  if (allJobs.length === 0) {
    console.warn('⚠️  No jobs fetched from any source.')
    return { synced: 0, total: await Job.countDocuments({ isActive: true }) }
  }

  const saved = await upsertJobs(allJobs)
  const total = await Job.countDocuments({ isActive: true })

  console.log(`✅ Job sync complete: ${saved} upserted, ${total} total in DB`)
  return { synced: saved, total }
}

export { syncJobs, fetchAdzuna, fetchRemotive }