import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Attach the verified user to req.user so route handlers can use it
const protect = async (req, res, next) => {
  try {
    // JWT should come in the Authorization header as: Bearer <token>
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Not authenticated. Please log in." });
    }

    const token = authHeader.split(" ")[1];

    // Verify signature + expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB (catches deleted/deactivated accounts)
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ message: "User not found or account deactivated." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError")
      return res.status(401).json({ message: "Invalid token." });
    if (err.name === "TokenExpiredError")
      return res
        .status(401)
        .json({ message: "Token expired. Please log in again." });
    next(err);
  }
};

// Optional auth — attach user if token present, but don't block if not
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
  } catch (_) {
    /* ignore */
  }
  next();
};

// Admin-only guard — use AFTER protect
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
};
export { protect, optionalAuth, adminOnly };
