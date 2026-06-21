import express from "express";
import { protect } from "../middleware/auth.js";
import Feedback from "../models/Feedback.js";

const router = express.Router();

router.use(protect);

const TYPES = ["job_match", "skill_gap", "chat", "general"];

// ── POST /api/feedback — submit feedback ────────────────────────────────────
router.post("/", async (req, res, next) => {
  try {
    const { type, rating, comment, referenceId, metadata } = req.body;

    if (!TYPES.includes(type)) {
      return res
        .status(400)
        .json({
          success: false,
          message: `type must be one of: ${TYPES.join(", ")}`,
        });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "rating must be between 1 and 5." });
    }
    if (comment && comment.length > 500) {
      return res
        .status(400)
        .json({
          success: false,
          message: "comment must be 500 characters or fewer.",
        });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      type,
      rating,
      comment: comment || "",
      referenceId: referenceId || null,
      metadata: metadata || {},
    });

    res
      .status(201)
      .json({ success: true, feedback, message: "Thanks for your feedback." });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/feedback/mine — user's own submitted feedback ─────────────────
router.get("/mine", async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ user: req.user._id })
      .sort("-createdAt")
      .lean();

    res.json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/feedback/mine/:type/:referenceId — check if already rated ─────
// Used by the frontend to avoid showing a rating widget twice for the
// same job/chat/skill-gap item.
router.get("/mine/:type/:referenceId", async (req, res, next) => {
  try {
    const { type, referenceId } = req.params;
    const existing = await Feedback.findOne({
      user: req.user._id,
      type,
      referenceId,
    }).lean();

    res.json({ success: true, feedback: existing || null });
  } catch (err) {
    next(err);
  }
});

export default router;
