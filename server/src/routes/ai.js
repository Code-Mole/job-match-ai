import express from "express";
import axios from "axios";
import { protect } from "../middleware/auth.js";

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const router = express.Router();

// ── POST /api/ai/skill-gap ────────────────────────────────────────────────────
router.post("/skill-gap", protect, async (req, res, next) => {
  try {
    const { data } = await axios.post(
      `${AI_URL}/skill-gap`,
      {
        user_skills: req.user.skills || [],
        ...req.body,
      },
      { timeout: 10000 },
    );
    res.json(data);
  } catch (err) {
    if (err.code === "ECONNREFUSED")
      return res.status(503).json({ message: "AI service unavailable." });
    next(err);
  }
});

// ── POST /api/ai/parse-text ───────────────────────────────────────────────────
router.post("/parse-text", protect, async (req, res, next) => {
  try {
    const { data } = await axios.post(`${AI_URL}/parse-text`, req.body, {
      timeout: 10000,
    });
    res.json(data);
  } catch (err) {
    if (err.code === "ECONNREFUSED")
      return res.status(503).json({ message: "AI service unavailable." });
    next(err);
  }
});

export default router;
