import express  from "express";
import Job  from "../../models/Job.js";
import  reloadMatcherJobs   from "../../utils/aiSync.js";


const router =  express.Router();
// NOTE: protect + adminOnly are applied centrally in routes/admin/index.js,
// which mounts this router. Every route below is admin-only by inheritance.

// ── Validation helpers ────────────────────────────────────────────────────

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Remote",
];
const JOB_LEVELS = ["Junior", "Mid", "Senior", "Lead", "Principal"];
const TRENDS = ["Increasing", "Stable", "Decreasing"];
const SOURCES = ["manual", "adzuna", "remotive", "seed", "admin"];

// Fields an admin is permitted to set directly via the API.
// Deliberately excludes _id, externalId mutation on update, createdAt, etc.
const WRITABLE_FIELDS = [
  "title",
  "company",
  "location",
  "country",
  "region",
  "type",
  "remote",
  "salaryMin",
  "salaryMax",
  "salary",
  "currency",
  "description",
  "requirements",
  "responsibilities",
  "skills",
  "level",
  "yearsExp",
  "companyLogo",
  "companySize",
  "industry",
  "companyUrl",
  "applyUrl",
  "deadline",
  "demandTrend",
  "isActive",
  "featured",
  "postedAt",
  "source",
  "externalId",
];

function pickWritable(body) {
  const out = {};
  for (const key of WRITABLE_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

// Validates a job payload. When partial=true (used for PUT and bulk
// updates), required-field checks only apply if that field is present
// in the payload — this allows updating a single field without
// resending the whole document.
function validateJobPayload(data, { partial = false } = {}) {
  const errors = [];

  const requiredIfPresent = (field, label) => {
    if (!partial || data[field] !== undefined) {
      if (!data[field] || !String(data[field]).trim()) {
        errors.push(`${label} is required.`);
      }
    }
  };

  requiredIfPresent("title", "title");
  requiredIfPresent("company", "company");
  requiredIfPresent("location", "location");
  requiredIfPresent("description", "description");

  if (data.type !== undefined && !JOB_TYPES.includes(data.type)) {
    errors.push(`type must be one of: ${JOB_TYPES.join(", ")}`);
  }
  if (data.level !== undefined && !JOB_LEVELS.includes(data.level)) {
    errors.push(`level must be one of: ${JOB_LEVELS.join(", ")}`);
  }
  if (data.demandTrend !== undefined && !TRENDS.includes(data.demandTrend)) {
    errors.push(`demandTrend must be one of: ${TRENDS.join(", ")}`);
  }
  if (data.source !== undefined && !SOURCES.includes(data.source)) {
    errors.push(`source must be one of: ${SOURCES.join(", ")}`);
  }
  if (data.skills !== undefined && !Array.isArray(data.skills)) {
    errors.push("skills must be an array of strings.");
  }
  if (data.requirements !== undefined && !Array.isArray(data.requirements)) {
    errors.push("requirements must be an array of strings.");
  }
  if (
    data.responsibilities !== undefined &&
    !Array.isArray(data.responsibilities)
  ) {
    errors.push("responsibilities must be an array of strings.");
  }
  if (data.salaryMin !== undefined && isNaN(Number(data.salaryMin))) {
    errors.push("salaryMin must be a number.");
  }
  if (data.salaryMax !== undefined && isNaN(Number(data.salaryMax))) {
    errors.push("salaryMax must be a number.");
  }

  return errors;
}

// ── GET /api/admin/jobs — paginated, searchable, filterable list ──────────
router.get("/", async (req, res, next) => {
  try {
    const {
      search,
      country,
      source,
      isActive,
      featured,
      page = 1,
      limit = 20,
      sort = "-postedAt",
    } = req.query;

    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (country)
      filter.country = { $regex: `^${escapeRegex(country)}$`, $options: "i" };
    if (source) filter.source = source;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (featured !== undefined) filter.featured = featured === "true";

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.max(1, Math.ceil(total / Number(limit))),
      jobs,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/admin/jobs/:id — single job (for the edit form) ──────────────
router.get("/:id", async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job)
      return res
        .status(404)
        .json({ success: false, message: "Job not found." });
    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/admin/jobs — create a new job ────────────────────────────────
router.post("/", async (req, res, next) => {
  try {
    const errors = validateJobPayload(req.body);
    if (errors.length) {
      return res
        .status(400)
        .json({ success: false, message: errors.join(" ") });
    }

    const data = pickWritable(req.body);
    data.source = data.source || "admin";
    data.createdBy = req.user._id;
    data.updatedBy = req.user._id;
    if (!data.postedAt) data.postedAt = new Date();

    const job = await Job.create(data);

    reloadMatcherJobs(); // fire-and-forget — see utils/aiSync.js

    res.status(201).json({ success: true, job, message: "Job created." });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/admin/jobs/:id — update an existing job (any source) ─────────
router.put("/:id", async (req, res, next) => {
  try {
    const errors = validateJobPayload(req.body, { partial: true });
    if (errors.length) {
      return res
        .status(400)
        .json({ success: false, message: errors.join(" ") });
    }

    const data = pickWritable(req.body);
    data.updatedBy = req.user._id;

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!job)
      return res
        .status(404)
        .json({ success: false, message: "Job not found." });

    reloadMatcherJobs();

    res.json({ success: true, job, message: "Job updated." });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/admin/jobs/:id/featured — toggle or set featured flag ──────
router.patch("/:id/featured", async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res
        .status(404)
        .json({ success: false, message: "Job not found." });

    // If `featured` is provided in the body, set it explicitly;
    // otherwise toggle the current value.
    job.featured =
      req.body.featured !== undefined ? !!req.body.featured : !job.featured;
    job.updatedBy = req.user._id;
    await job.save();

    res.json({
      success: true,
      featured: job.featured,
      message: `Job ${job.featured ? "marked as featured" : "removed from featured"}.`,
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/admin/jobs/:id — soft delete, or hard delete with ?permanent=true
router.delete("/:id", async (req, res, next) => {
  try {
    const permanent = req.query.permanent === "true";

    if (permanent) {
      const job = await Job.findByIdAndDelete(req.params.id);
      if (!job)
        return res
          .status(404)
          .json({ success: false, message: "Job not found." });

      reloadMatcherJobs();

      return res.json({ success: true, message: "Job permanently deleted." });
    }

    // Default: soft delete — keeps the record but hides it from users
    // and excludes it from AI matching.
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false, updatedBy: req.user._id } },
      { new: true },
    );
    if (!job)
      return res
        .status(404)
        .json({ success: false, message: "Job not found." });

    reloadMatcherJobs();

    res.json({ success: true, message: "Job deactivated.", job });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/admin/jobs/bulk — bulk import for Ghana seed data (Step 10) ──
router.post("/bulk", async (req, res, next) => {
  try {
    const { jobs } = req.body;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Provide a non-empty "jobs" array.' });
    }
    if (jobs.length > 500) {
      return res
        .status(400)
        .json({ success: false, message: "Maximum 500 jobs per bulk import." });
    }

    const results = { inserted: 0, updated: 0, failed: 0, errors: [] };
    const ops = [];

    jobs.forEach((raw, idx) => {
      const errors = validateJobPayload(raw);
      if (errors.length) {
        results.failed++;
        results.errors.push({
          index: idx,
          title: raw.title || "(no title)",
          errors,
        });
        return;
      }

      const data = pickWritable(raw);
      data.source = data.source || "admin";
      data.createdBy = req.user._id;
      data.updatedBy = req.user._id;
      if (!data.postedAt) data.postedAt = new Date();

      // If the job specifies an externalId, upsert by it so re-running
      // the same import file doesn't create duplicates. Otherwise insert.
      if (raw.externalId) {
        ops.push({
          updateOne: {
            filter: { externalId: raw.externalId },
            update: { $set: data },
            upsert: true,
          },
        });
      } else {
        ops.push({ insertOne: { document: data } });
      }
    });

    if (ops.length) {
      const writeResult = await Job.bulkWrite(ops, { ordered: false });
      results.inserted =
        (writeResult.insertedCount || 0) + (writeResult.upsertedCount || 0);
      results.updated = writeResult.modifiedCount || 0;
    }

    reloadMatcherJobs();

    res.json({
      success: true,
      ...results,
      message: `${results.inserted} inserted, ${results.updated} updated, ${results.failed} failed.`,
    });
  } catch (err) {
    next(err);
  }
});

// ── Helper: escape regex special characters in user input ──────────────────
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default router;
