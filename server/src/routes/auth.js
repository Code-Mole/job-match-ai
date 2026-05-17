import express from "express";
import bcrypt from "bcryptjs";
import axios from "axios";
import User from "../models/User.js";
import Job from "../models/Job.js";
import { protect } from "../middleware/auth.js";
import { signToken, sendAuthResponse } from "../utils/jwt.js";
import {
  isSmtpConfigured,
  verifySmtpConnection,
  sendMail,
} from "../utils/email.js";
import {
  getGoogleAuthUrl,
  getLinkedInAuthUrl,
  handleGoogleCallback,
  handleLinkedInCallback,
  oauthRedirectWithToken,
} from "../utils/oauth.js";

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get("/google", (req, res) => {
  const url = getGoogleAuthUrl();
  if (!url) {
    return res.redirect(
      `${CLIENT_URL}/login?error=${encodeURIComponent("Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to server/.env")}`,
    );
  }
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error || !code) {
      return res.redirect(
        `${CLIENT_URL}/login?error=${encodeURIComponent(error || "Google sign-in was cancelled.")}`,
      );
    }
    const token = await handleGoogleCallback(code);
    res.redirect(oauthRedirectWithToken(token));
  } catch (err) {
    res.redirect(
      `${CLIENT_URL}/login?error=${encodeURIComponent(err.message || "Google sign-in failed.")}`,
    );
  }
});

// ── LinkedIn OAuth ────────────────────────────────────────────────────────────
router.get("/linkedin", (req, res) => {
  const url = getLinkedInAuthUrl();
  if (!url) {
    return res.redirect(
      `${CLIENT_URL}/login?error=${encodeURIComponent("LinkedIn sign-in is not configured. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to server/.env")}`,
    );
  }
  res.redirect(url);
});

router.get("/linkedin/callback", async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error || !code) {
      return res.redirect(
        `${CLIENT_URL}/login?error=${encodeURIComponent(error || "LinkedIn sign-in was cancelled.")}`,
      );
    }
    const token = await handleLinkedInCallback(code);
    res.redirect(oauthRedirectWithToken(token));
  } catch (err) {
    res.redirect(
      `${CLIENT_URL}/login?error=${encodeURIComponent(err.message || "LinkedIn sign-in failed.")}`,
    );
  }
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }
    // if (!name || !email || !password) {
    //   return res
    //     .status(400)
    //     .json({ message: "Name, email, and password are required." });
    // }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }
    // hashing the password is handled by the pre-save hook in the User model
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user — password is hashed by the pre-save hook in User.js
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });
    const token = signToken(user._id);

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendAuthResponse(res, 201, user, token);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }
    // compare password

    // Must explicitly select password since it's select:false in schema
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
    if (!user) {
      // Use generic message to avoid user enumeration attacks
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Account has been deactivated. Contact support." });
    }

    // Track last login time
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    sendAuthResponse(res, 200, user, token);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
});

// ── GET /api/auth/me  (protected) ────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  // req.user is already populated by the protect middleware
  res.json({ success: true, user: req.user.toSafeObject() });
});

// ── PUT /api/auth/profile  (protected) ───────────────────────────────────────
router.put("/profile", protect, async (req, res, next) => {
  try {
    // Whitelist updatable fields — never let users set role or password this way
    const allowed = [
      "name",
      "headline",
      "bio",
      "location",
      "phone",
      "linkedin",
      "github",
      "website",
      "skills",
      "experience",
      "education",
      "preferences",
      "notificationPrefs",
      "privacyPrefs",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/auth/change-password  (protected) ───────────────────────────────
router.put("/change-password", protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new passwords are required." });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters." });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Current password is incorrect." });
    }
    //hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword; // pre-save hook will hash it
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/auth/account ──────────────────────────────────────────────────
router.delete('/account', protect, async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id)
    res.json({ success: true, message: 'Account deleted.' })
  } catch (err) { next(err) }
})

// ── GET /api/auth/export ──────────────────────────────────────────────────────
router.get('/export', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -__v')
    res.json({ exported_at: new Date(), user })
  } catch (err) { next(err) }
})

// ── GET /api/auth/stats ───────────────────────────────────────────────────────
router.get('/stats', protect, async (req, res, next) => {
  try {
    const user = req.user
    const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

    const [totalJobs, appliedCount, savedCount] = await Promise.all([
      Job.countDocuments({ isActive: true }),
      user.appliedJobs?.length || 0,
      user.savedJobs?.length   || 0,
    ])

    let avgMatchScore = null
    let topMatchScore = null

    if (user.skills?.length) {
      try {
        const jobs = await Job.find({ isActive: true }).lean().limit(100)
        if (jobs.length) {
          try {
            await axios.post(`${AI_URL}/load-jobs`, { jobs }, { timeout: 8000 })
          } catch { /* non-fatal */ }

          const { data: aiData } = await axios.post(
            `${AI_URL}/match`,
            { skills: user.skills, years_exp: user.yearsExp || 0, top_n: 10 },
            { timeout: 12000 },
          )
          const scores = (aiData.matches || [])
            .map((m) => m.match_score)
            .filter((s) => typeof s === 'number')
          if (scores.length) {
            avgMatchScore = Math.round(
              scores.reduce((a, b) => a + b, 0) / scores.length,
            )
            topMatchScore = Math.max(...scores)
          }
        }
      } catch { /* AI optional */ }
    }

    const skillPts = Math.min(30, (user.skills?.length || 0) * 3)
    const profileStrength = Math.min(
      100,
      Math.round(
        (user.cvParsed ? 35 : 0) +
        skillPts +
        (user.experience?.length > 0 ? 15 : 0) +
        (user.headline ? 8 : 0) +
        (user.bio ? 8 : 0) +
        (user.location ? 4 : 0) +
        (avgMatchScore ? Math.min(10, Math.round(avgMatchScore / 10)) : 0),
      ),
    )

    res.json({
      success: true,
      totalJobs,
      appliedCount,
      savedCount,
      skillCount: user.skills?.length || 0,
      cvParsed: user.cvParsed || false,
      profileStrength,
      avgMatchScore,
      topMatchScore,
      smtpConfigured: isSmtpConfigured(),
    })
  } catch (err) { next(err) }
})

// ── GET /api/auth/settings/email-status ─────────────────────────────────────
router.get('/settings/email-status', protect, async (req, res) => {
  res.json({
    success: true,
    configured: isSmtpConfigured(),
    host: process.env.SMTP_HOST || null,
    from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
  })
})

// ── POST /api/auth/settings/test-email ────────────────────────────────────────
router.post('/settings/test-email', protect, async (req, res, next) => {
  try {
    await verifySmtpConnection()
    await sendMail({
      to: req.user.email,
      subject: 'JobMatch AI — SMTP test successful',
      html: `<p>Hi ${req.user.name?.split(' ')[0] || 'there'},</p><p>Your SMTP settings are working. Application confirmation emails will be delivered to this address.</p>`,
      text: 'Your JobMatch AI SMTP settings are working.',
    })
    res.json({ success: true, message: `Test email sent to ${req.user.email}` })
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'SMTP test failed. Check server/.env credentials.',
    })
  }
})

export default router;
