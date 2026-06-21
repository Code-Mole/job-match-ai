import express from "express";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();
router.use(protect);

const STATUSES = [
  "applied",
  "interviewing",
  "offered",
  "rejected",
  "withdrawn",
];

// ── GET /api/applications — list the user's applications with job details ──
router.get("/", async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "appliedJobs.job",
        select:
          "title company location salary type remote level isActive applyUrl",
      })
      .select("appliedJobs")
      .lean();

    // Filter out applications whose job was permanently deleted
    const applications = (user.appliedJobs || [])
      .filter((a) => a.job)
      .map((a) => ({
        _id: a._id,
        job: a.job,
        status: a.status,
        appliedAt: a.appliedAt,
      }))
      .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    res.json({ success: true, applications });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/applications/:appliedJobId/status — user updates their own tracking status ──
// Lets a user mark "interviewing", "offered", "rejected", "withdrawn" themselves,
// since the platform has no employer-side integration to update this automatically.
router.patch("/:appliedJobId/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          message: `status must be one of: ${STATUSES.join(", ")}`,
        });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.user._id, "appliedJobs._id": req.params.appliedJobId },
      { $set: { "appliedJobs.$.status": status } },
      { new: true },
    ).populate("appliedJobs.job", "title company");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Application not found." });

    const updated = user.appliedJobs.id(req.params.appliedJobId);

    res.json({
      success: true,
      message: "Application status updated.",
      application: updated,
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/applications/:appliedJobId — withdraw / remove from tracker ──
router.delete("/:appliedJobId", async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { appliedJobs: { _id: req.params.appliedJobId } } },
      { new: true },
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });

    res.json({ success: true, message: "Application removed from tracker." });
  } catch (err) {
    next(err);
  }
});

export default router;
