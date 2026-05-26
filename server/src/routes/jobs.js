import express from 'express' 
import axios from "axios"
import Job     from '../models/Job.js'
import User    from '../models/User.js'
import { protect } from '../middleware/auth.js'
import { syncJobs } from '../services/jobsApiService.js'
import { dedupeJobs } from '../utils/dedupeJobs.js'
import { sendApplicationEmail } from '../utils/email.js'
import { wakeAiService } from '../utils/aiServiceManager.js'

const router = express.Router();
// ── GET /api/jobs — List with filters + pagination ───────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const {
      search, location, type, remote,
      salaryMin, salaryMax, level,
      page = 1, limit = 20, sort = '-postedAt',
    } = req.query

    const filter = { isActive: true }

    // Full-text search on title, description, company (requires text index)
    if (search) {
      filter.$text = { $search: search }
    }

    if (location) filter.location = { $regex: location, $options: 'i' }
    if (type)     filter.type     = type
    if (remote)   filter.remote   = remote === 'true'
    if (level)    filter.level    = level

    if (salaryMin || salaryMax) {
      const salaryParts = []
      if (salaryMin) salaryParts.push({ salaryMax: {  $gte: Number(salaryMin) } })
      if (salaryMax) salaryParts.push({ salaryMin: { $lte: Number(salaryMax) } })
      filter.$and = [...(filter.$and || []), ...salaryParts]
    }

    const skip  = (Number(page) - 1) * Number(limit)
    const total = await Job.countDocuments(filter)
    const rawJobs = await Job.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit) * 2)
      .lean()

    const jobs = dedupeJobs(rawJobs).slice(0, Number(limit))

    res.json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      jobs,
    })

  } catch (err) {
    next(err)
  }
})

// ── GET /api/jobs/match — AI scores merged with full job data ─────────────────
router.get('/match', protect, async (req, res, next) => {
  try {
    await wakeAiService();
    const user    = req.user
    const AI_URL  = process.env.AI_SERVICE_URL || 'http://localhost:8000'

    if (!user.skills?.length && !user.cvText) {
      // No CV/skills yet — return plain recent jobs with null scores
      const jobs = await Job.find({ isActive: true })
        .sort({ postedAt: -1 })
        .limit(10)
        .lean()

      return res.json({
        success: true,
        matches: jobs.map(j => ({
          job_id:      j._id,
          title:       j.title,
          company:     j.company,
          location:    j.location,
          salary:      j.salary,
          type:        j.type,
          remote:      j.remote,
          level:       j.level,
          match_score: null,
          matched_skills: [],
          missing_skills: j.skills || [],
          component_scores: {},
        })),
      })
    }

    // Load jobs from DB
    const jobs = await Job.find({ isActive: true }).lean().limit(100)

    // Reload AI service with current jobs
    try {
      await axios.post(`${AI_URL}/load-jobs`, { jobs }, { timeout: 120000 });
    } catch { /* non-fatal */ }

    // Get scores — uses full CV text + strength weights for best-fit matching
    const { data: aiData } = await axios.post(
      `${AI_URL}/match`,
      {
        skills: user.skills,
        years_exp: user.yearsExp || 0,
        cv_text: user.cvText || "",
        strengths: user.skillStrengths || {},
        cv_roles: user.cvRoles || [],
        top_n: 25,
      },
      { timeout: 120000 },
    );

    // Merge AI scores with full job documents
    const matches = (aiData.matches || []).map(m => {
      const job = jobs.find(j =>
        j._id.toString() === m.job_id || j.externalId === m.job_id
      )
      if (!job) return null
      return {
        job_id:           job._id,
        title:            job.title,
        company:          job.company,
        location:         job.location,
        salary:           job.salary,
        type:             job.type,
        remote:           job.remote,
        level:            job.level,
        industry:         job.industry,
        applyUrl:         job.applyUrl,
        match_score:      m.match_score,
        matched_skills:   m.matched_skills,
        missing_skills:   m.missing_skills,
        component_scores: m.component_scores,
      }
    }).filter(Boolean)

    const uniqueMatches = dedupeJobs(
      matches.map((m) => ({ ...m, _id: m.job_id, externalId: m.job_id })),
    ).map((m) => ({
      job_id: m.job_id || m._id,
      title: m.title,
      company: m.company,
      location: m.location,
      salary: m.salary,
      type: m.type,
      remote: m.remote,
      level: m.level,
      industry: m.industry,
      applyUrl: m.applyUrl,
      match_score: m.match_score,
      matched_skills: m.matched_skills,
      missing_skills: m.missing_skills,
      component_scores: m.component_scores,
    }))

    res.json({ success: true, matches: uniqueMatches })

  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      // AI down — return jobs without scores
      try {
        const jobs = await Job.find({ isActive: true }).sort({ postedAt: -1 }).limit(10).lean()
        return res.json({
          success: true,
          matches: jobs.map(j => ({
            job_id: j._id, title: j.title, company: j.company,
            location: j.location, salary: j.salary, type: j.type,
            remote: j.remote, level: j.level, match_score: null,
            matched_skills: [], missing_skills: j.skills || [],
          })),
        })
      } catch (dbErr) { return next(dbErr) }
    }
    next(err)
  }
})


// ── POST /api/jobs/sync — Fetch latest jobs from real APIs ───────────────────
router.post('/sync', async (req, res, next) => {
  try {
    const force = req.query.force === 'true'
    const category =
      req.query.category ||
      req.body?.category ||
      'all'
    const result = await syncJobs(force, String(category))
    res.json({ success: true, ...result })
  } catch (err) { next(err) }
})



// ── POST /api/jobs/seed — Load sample data ───────────────────────────────────
// This lets you quickly populate the DB for demo/testing
router.post('/seed', async (req, res, next) => {
  try {
    // Remove existing jobs first so re-seeding is idempotent
    await Job.deleteMany({})

    const sampleJobs = [
      {
        title: 'Senior Frontend Developer',
        company: 'Stripe',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        salaryMin: 120000,
        salaryMax: 150000,
        salary: '$120k–$150k',
        level: 'Senior',
        yearsExp: 5,
        industry: 'Fintech',
        description: 'We are looking for a Senior Frontend Developer to join our Payments team at Stripe. You will build and maintain our web applications used by millions of businesses globally. You will work closely with product designers and backend engineers to deliver exceptional user experiences.',
        requirements: ['5+ years React experience', 'TypeScript proficiency', 'Experience with testing (Jest, Cypress)', 'Strong CSS and accessibility knowledge'],
        responsibilities: ['Build reusable UI components', 'Optimize application performance', 'Lead frontend architecture decisions', 'Mentor junior developers'],
        skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Jest', 'Webpack', 'GraphQL', 'REST APIs'],
        demandTrend: 'Increasing',
        featured: true,
      },
      {
        title: 'Full Stack Engineer',
        company: 'Vercel',
        location: 'San Francisco, CA',
        type: 'Full-time',
        remote: false,
        salaryMin: 130000,
        salaryMax: 160000,
        salary: '$130k–$160k',
        level: 'Mid',
        yearsExp: 3,
        industry: 'Developer Tools',
        description: 'Join Vercel as a Full Stack Engineer and help us build the future of web development. You will work on our deployment platform, edge network, and developer tooling that powers millions of websites.',
        requirements: ['3+ years full stack experience', 'Strong Node.js skills', 'PostgreSQL or similar', 'Experience with cloud platforms'],
        responsibilities: ['Design and implement new features', 'Optimize database queries', 'Build and maintain APIs', 'Collaborate with design and product'],
        skills: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'TypeScript', 'AWS', 'Docker', 'REST APIs'],
        demandTrend: 'Increasing',
      },
      {
        title: 'React Developer',
        company: 'Linear',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        salaryMin: 110000,
        salaryMax: 140000,
        salary: '$110k–$140k',
        level: 'Mid',
        yearsExp: 3,
        industry: 'Productivity Software',
        description: 'Linear is building the new standard for project management. We are looking for a React Developer to help us build a product that thousands of teams depend on daily.',
        requirements: ['React and hooks expertise', 'GraphQL experience', 'Attention to UI/UX detail', 'Experience with real-time apps'],
        responsibilities: ['Build performant React components', 'Integrate GraphQL APIs', 'Write comprehensive tests', 'Improve frontend architecture'],
        skills: ['React', 'GraphQL', 'TypeScript', 'CSS', 'JavaScript', 'Jest', 'WebSockets'],
        demandTrend: 'Stable',
      },
      {
        title: 'UI Engineer',
        company: 'Figma',
        location: 'New York, NY',
        type: 'Full-time',
        remote: false,
        salaryMin: 125000,
        salaryMax: 155000,
        salary: '$125k–$155k',
        level: 'Mid',
        yearsExp: 4,
        industry: 'Design Software',
        description: 'Figma is looking for a UI Engineer to help us build one of the most complex web applications in existence. You will work on the canvas, properties panel, and plugin ecosystem.',
        requirements: ['Deep JavaScript knowledge', 'Experience with Canvas or WebGL', 'Strong TypeScript', 'Performance optimization experience'],
        responsibilities: ['Build complex interactive UI', 'Optimize rendering performance', 'Implement new Figma features', 'Collaborate with designers'],
        skills: ['JavaScript', 'TypeScript', 'React', 'WebGL', 'Canvas API', 'CSS', 'Performance'],
        demandTrend: 'Stable',
      },
      {
        title: 'Backend Engineer',
        company: 'PlanetScale',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        salaryMin: 140000,
        salaryMax: 180000,
        salary: '$140k–$180k',
        level: 'Senior',
        yearsExp: 6,
        industry: 'Database',
        description: 'Join PlanetScale to work on the world\'s most scalable MySQL platform. You will build the infrastructure and APIs that power our database-as-a-service product.',
        requirements: ['6+ years backend experience', 'Go or Rust experience', 'Distributed systems knowledge', 'MySQL internals understanding'],
        responsibilities: ['Design distributed systems', 'Build internal APIs', 'Optimize database performance', 'Write technical documentation'],
        skills: ['Go', 'MySQL', 'Kubernetes', 'Docker', 'REST APIs', 'Distributed Systems', 'Linux'],
        demandTrend: 'Increasing',
      },
      {
        title: 'Machine Learning Engineer',
        company: 'Hugging Face',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        salaryMin: 150000,
        salaryMax: 200000,
        salary: '$150k–$200k',
        level: 'Senior',
        yearsExp: 4,
        industry: 'AI/ML',
        description: 'Hugging Face is the AI community building the future. Join us to work on open-source ML tools, models, and infrastructure used by millions of researchers and developers.',
        requirements: ['Strong Python skills', 'PyTorch or TensorFlow', 'NLP or CV experience', 'Published research preferred'],
        responsibilities: ['Train and fine-tune models', 'Build ML pipelines', 'Contribute to open source', 'Write research papers'],
        skills: ['Python', 'PyTorch', 'NLP', 'Machine Learning', 'Deep Learning', 'HuggingFace', 'Docker', 'CUDA'],
        demandTrend: 'Increasing',
      },
      {
        title: 'DevOps Engineer',
        company: 'Cloudflare',
        location: 'Austin, TX',
        type: 'Full-time',
        remote: false,
        salaryMin: 115000,
        salaryMax: 145000,
        salary: '$115k–$145k',
        level: 'Mid',
        yearsExp: 3,
        industry: 'Infrastructure',
        description: 'Cloudflare is building a better internet. We need DevOps Engineers to maintain and improve the infrastructure that serves millions of requests per second.',
        requirements: ['Kubernetes expertise', 'CI/CD pipeline experience', 'Terraform or Ansible', 'Linux system administration'],
        responsibilities: ['Manage Kubernetes clusters', 'Build CI/CD pipelines', 'Monitor system health', 'Automate infrastructure'],
        skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'Linux', 'CI/CD', 'Python', 'Bash'],
        demandTrend: 'Stable',
      },
      {
        title: 'Product Designer',
        company: 'Notion',
        location: 'San Francisco, CA',
        type: 'Full-time',
        remote: false,
        salaryMin: 130000,
        salaryMax: 160000,
        salary: '$130k–$160k',
        level: 'Mid',
        yearsExp: 4,
        industry: 'Productivity Software',
        description: 'Notion is on a mission to make toolmaking ubiquitous. We are looking for a Product Designer to help design the next generation of our all-in-one workspace.',
        requirements: ['4+ years product design', 'Figma proficiency', 'Strong systems thinking', 'User research experience'],
        responsibilities: ['Design new product features', 'Conduct user research', 'Build design systems', 'Collaborate with engineering'],
        skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Design Systems', 'User Testing'],
        demandTrend: 'Stable',
      },
    ]

    const inserted = await Job.insertMany(sampleJobs)
    res.json({ success: true, message: `Seeded ${inserted.length} jobs.`, count: inserted.length })

  } catch (err) {
    next(err)
  }
})


// ── GET /api/jobs/my/applied — User's applied jobs ───────────────────────────
router.get('/my/applied', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({ path: 'appliedJobs.job', match: { isActive: true } })
      .lean()

    const applications = (user.appliedJobs || [])
      .filter((a) => a.job)
      .map((a) => ({
        ...a.job,
        appliedAt: a.appliedAt,
        status: a.status,
      }))

    res.json({ success: true, jobs: dedupeJobs(applications) })
  } catch (err) { next(err) }
})

// ── GET /api/jobs/my/saved — User's saved jobs ────────────────────────────────
router.get('/my/saved', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({ path: 'savedJobs', match: { isActive: true } })
      .lean()

    res.json({ success: true, jobs: dedupeJobs(user.savedJobs || []) })
  } catch (err) { next(err) }
})

// ── GET /api/jobs/:id — Single job ───────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).lean()
    if (!job) return res.status(404).json({ message: 'Job not found.' })
    res.json({ success: true, job })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/jobs/:id/save ───────────────────────────────────────────────────
router.post('/:id/save', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    const jobId = req.params.id
    const idx   = user.savedJobs.indexOf(jobId)

    if (idx === -1) {
      user.savedJobs.push(jobId)
    } else {
      user.savedJobs.splice(idx, 1) // toggle off
    }

    await user.save({ validateBeforeSave: false })
    res.json({ success: true, saved: idx === -1 })
  } catch (err) { next(err) }
})

// ── POST /api/jobs/:id/apply ──────────────────────────────────────────────────
router.post('/:id/apply', protect, async (req, res, next) => {
  try {
    const job  = await Job.findById(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found.' })

    const user = await User.findById(req.user._id)

    // Check already applied
    const already = user.appliedJobs.find(a => a.job.toString() === req.params.id)
    if (already) return res.json({ success: true, alreadyApplied: true, message: 'You already applied to this job.' })

    // Record application in DB
    user.appliedJobs.push({ job: req.params.id, appliedAt: new Date(), status: 'applied' })
    await user.save({ validateBeforeSave: false })

    // Send confirmation email (non-blocking)
    sendApplicationEmail(user, job).catch(err => console.warn('Email send failed:', err.message))

    res.json({
      success:     true,
      message:     `Application to ${job.title} at ${job.company} recorded.`,
      applyUrl:    job.applyUrl || null,  // frontend opens this in new tab
      appliedAt:   new Date(),
    })

  } catch (err) { next(err) }
})

export default router