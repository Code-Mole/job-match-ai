import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { signToken, sendAuthResponse } from "../utils/jwt.js";

const router = express.Router();
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

export default router;
