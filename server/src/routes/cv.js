import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── Multer config ─────────────────────────────────────────────────────────────
// Store files in server/uploads/ with a unique name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    // Create uploads folder if it doesn't exist
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // user_<id>_<timestamp>.<ext> — prevents collisions
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user_${req.user._id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".docx", ".txt"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOCX, and TXT files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ── POST /api/cv/upload ───────────────────────────────────────────────────────
router.post("/upload", protect, upload.single("cv"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file." });
    }

    // Save the file path to the user record
    await User.findByIdAndUpdate(req.user._id, {
      cvPath: req.file.path,
      cvUploadedAt: new Date(),
      cvParsed: false, // Will be set to true after AI parsing in Step 9
    });

    // In Step 9, we'll call the Python AI service here to parse the CV
    // For now, return success with file info
    res.json({
      success: true,
      message: "CV uploaded successfully. AI parsing will begin shortly.",
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path,
        mimetype: req.file.mimetype,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/cv/status ────────────────────────────────────────────────────────
router.get("/status", protect, async (req, res) => {
  res.json({
    success: true,
    cvParsed: req.user.cvParsed,
    cvUploadedAt: req.user.cvUploadedAt,
    hasCV: !!req.user.cvPath,
  });
});

export default router;
