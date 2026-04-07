import express from 'express' 
import axios from "axios"
import Job     from '../models/Job.js'
import { protect, adminOnly } from '../middleware/auth.js'

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

    // Salary range overlap filter
    if (salaryMin) filter.salaryMax = { $gte: Number(salaryMin) }
    if (salaryMax) filter.salaryMin = { $lte: Number(salaryMax) }

    const skip  = (Number(page) - 1) * Number(limit)
    const total = await Job.countDocuments(filter)
    const jobs  = await Job.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean() // Returns plain JS object instead of Mongoose document — faster

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

// ── GET /api/jobs/match — Get AI match scores for current user ─────────────────────
router.get('/match', protect, async (req, res, next) => {
  try {
    const user = req.user

    // Call the Python AI service
    const aiResponse = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/match`,
      {
        skills:    user.skills || [],
        cv_text:   '',        // Will be populated after CV parsing in Step 9
        years_exp: 0,         // Will come from parsed CV in Step 9
        top_n:     20,
      },
      { timeout: 10000 }       // 10s timeout
    )

    res.json(aiResponse.data)

  } catch (err) {
    // If AI service is down, return jobs without scores
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'AI service unavailable. Try again shortly.' })
    }
    next(err)
  }
})

// ── POST /api/jobs/:id/save ───────────────────────────────────────────────────
router.post('/:id/save', protect, async (req, res, next) => {
  try {
    const user = await require('../models/User').findById(req.user._id)
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
    const user  = await require('../models/User').findById(req.user._id)
    const jobId = req.params.id
    const already = user.appliedJobs.find(a => a.job.toString() === jobId)

    if (!already) {
      user.appliedJobs.push({ job: jobId })
      await user.save({ validateBeforeSave: false })
    }

    res.json({ success: true, message: 'Application recorded.' })
  } catch (err) { next(err) }
})

export default router