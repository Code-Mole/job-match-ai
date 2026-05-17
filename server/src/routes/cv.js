import express  from 'express'
import multer   from 'multer'
import path     from 'path'
import fs       from 'fs'
import axios    from 'axios'
import FormData from 'form-data'
import User     from '../models/User.js'
import Job      from '../models/Job.js'
import { protect } from '../middleware/auth.js'
import { dedupeJobs } from '../utils/dedupeJobs.js'
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router   = express.Router();
// ── Multer ────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `cv_${req.user._id}_${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (['.pdf','.docx','.txt'].includes(ext)) return cb(null, true)
    cb(new Error('Only PDF, DOCX, and TXT files are allowed.'))
  },
  limits: { fileSize: 10 * 1024 * 1024 },
})

function cleanup(p) { if (p && fs.existsSync(p)) fs.unlink(p, () => {}) }

// ── GET /api/cv/ping ──────────────────────────────────────────────────────────
router.get('/ping', protect, (req, res) => {
  res.json({ ok: true, user: req.user.email, ai_url: process.env.AI_SERVICE_URL || 'http://localhost:8000' })
})

// ── GET /api/cv/status ────────────────────────────────────────────────────────
router.get('/status', protect, (req, res) => {
  res.json({
    success:      true,
    cvParsed:     req.user.cvParsed     || false,
    cvUploadedAt: req.user.cvUploadedAt || null,
    hasCV:        !!req.user.cvPath,
    skills:       req.user.skills       || [],
  })
})

// ── POST /api/cv/parse ────────────────────────────────────────────────────────
router.post('/parse', protect, upload.single('file'), async (req, res, next) => {
  const filePath = req.file?.path

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file received.' })
    }

    const AI_URL     = process.env.AI_SERVICE_URL || 'http://localhost:8000'
    let skills       = []
    let yearsExp     = 0
    let wordCount    = 0
    let aiAvailable  = false

    // ── Step 1: Parse CV with Flask ───────────────────────────────────────────
    try {
      const form = new FormData()
      form.append('file', fs.createReadStream(filePath), {
        filename:    req.file.originalname,
        contentType: req.file.mimetype,
      })

      const { data: parsed } = await axios.post(`${AI_URL}/parse-cv`, form, {
        headers: { ...form.getHeaders() },
        timeout: 25000,
      })

      if (parsed.success) {
        skills      = parsed.skills            || []
        yearsExp    = parsed.years_experience  || 0
        wordCount   = parsed.word_count        || 0
        aiAvailable = true
      }
    } catch (flaskErr) {
      console.warn('Flask parse failed:', flaskErr.message, '— using fallback')
      skills = extractSkillsFallback(filePath, req.file.originalname)
    }

    // ── Step 2: ALWAYS save skills to user profile ────────────────────────────
    // Use $set to guarantee the write happens even if skills array is empty
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          skills:       skills,
          cvParsed:     true,
          cvUploadedAt: new Date(),
          cvPath:       req.file.originalname,
          yearsExp:     yearsExp,
        }
      },
      { new: true, runValidators: false }
    )

    if (!updatedUser) {
      throw new Error('Failed to update user profile — user not found.')
    }

    console.log(`✅ CV parsed for ${updatedUser.email}: ${skills.length} skills saved`)

    // ── Step 3: Score jobs against extracted skills ───────────────────────────
    let topMatches = []

    try {
      // Load jobs from MongoDB (real jobs if synced, seeded jobs otherwise)
      const jobs = await Job.find({ isActive: true }).lean().limit(100)

      if (jobs.length > 0) {
        // Tell Flask about the current job list so it can vectorise them
        if (aiAvailable) {
          try {
            await axios.post(`${AI_URL}/load-jobs`, { jobs }, { timeout: 10000 })
          } catch { /* non-fatal */ }
        }

        // Get match scores
        const matchRes = await axios.post(
          `${AI_URL}/match`,
          { skills, years_exp: yearsExp, cv_text: '', top_n: 10 },
          { timeout: 15000 }
        )

        // Hydrate matches with full job documents from DB
        const matches = matchRes.data.matches || []
        topMatches = matches.map(m => {
          // Try to find the job by _id or externalId
          const dbJob = jobs.find(j =>
            j._id.toString() === m.job_id ||
            j.externalId     === m.job_id
          )
          if (!dbJob) return null
          return {
            job_id:          m.job_id,
            match_score:     m.match_score,
            matched_skills:  m.matched_skills,
            missing_skills:  m.missing_skills,
            component_scores: m.component_scores,
            // Flatten job fields so frontend can render cards directly
            _id:      dbJob._id,
            title:    dbJob.title,
            company:  dbJob.company,
            location: dbJob.location,
            salary:   dbJob.salary,
            type:     dbJob.type,
            remote:   dbJob.remote,
            level:    dbJob.level,
            skills:   dbJob.skills,
            applyUrl: dbJob.applyUrl,
            matchScore:    m.match_score,
            matchedSkills: m.matched_skills,
            missingSkills: m.missing_skills,
          }
        }).filter(Boolean)

        topMatches = dedupeJobs(topMatches.map((m) => ({
          ...m,
          externalId: m._id?.toString?.() || m.job_id,
        })))
      }
    } catch (matchErr) {
      console.warn('Match scoring failed:', matchErr.message)
    }

    cleanup(filePath)

    res.json({
      success:          true,
      skills:           updatedUser.skills,
      years_experience: yearsExp,
      word_count:       wordCount,
      ai_available:     aiAvailable,
      top_matches:      topMatches,
      message:          `CV analysed. ${updatedUser.skills.length} skills extracted.`,
    })

  } catch (err) {
    cleanup(filePath)
    console.error('CV parse error:', err.message)
    next(err)
  }
})

// ── Fallback: extract skills from raw file text ───────────────────────────────
function extractSkillsFallback(filePath, originalName) {
  const KNOWN = [
    'React','Vue','Angular','TypeScript','JavaScript','HTML','CSS','Tailwind',
    'Next.js','Node.js','Express','Python','Django','Flask','FastAPI',
    'Java','Go','Rust','PHP','Ruby','C#','C++','Swift','Kotlin',
    'PostgreSQL','MySQL','MongoDB','Redis','SQLite','Elasticsearch',
    'AWS','GCP','Azure','Docker','Kubernetes','Terraform','Linux','CI/CD',
    'Machine Learning','Deep Learning','PyTorch','TensorFlow','NLP',
    'scikit-learn','Pandas','NumPy','GraphQL','REST APIs','Git',
    'Figma','Agile','Testing','Jest','Pytest','System Design',
  ]
  try {
    const ext  = path.extname(originalName).toLowerCase()
    const buf  = fs.readFileSync(filePath)
    const text = ext === '.txt'
      ? buf.toString('utf8')
      : buf.toString('utf8', 0, Math.min(buf.length, 80000))
    const lower = text.toLowerCase()
    return KNOWN.filter(s =>
      new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(lower)
    )
  } catch { return [] }
}

export default router