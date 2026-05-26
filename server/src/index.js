import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";


// Route imports
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import cvRoutes from "./routes/cv.js";
import aiRoutes from "./routes/ai.js";

// AI keep-alive
import { startAiKeepAlive, stopAiKeepAlive } from "./utils/aiServiceManager.js";

dotenv.config();
// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

import { syncJobs } from "./services/jobsApiService.js";

// Sync jobs 30s after startup (give DB time to connect)
setTimeout(async () => {
  try {
    await syncJobs();
  } catch (err) {
    console.error("Startup job sync failed:", err.message);
  }
}, 30000);

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security middleware ───────────────────────────────────────────────────────
// helmet sets security-related HTTP headers
app.use(helmet());

// CORS — allow requests from the React frontend
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Logging ───────────────────────────────────────────────────────────────────
// 'dev' format: GET /api/jobs 200 12ms
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Static file serving (for uploaded CVs) ────────────────────────────────────
// Only serve uploads in development — use cloud storage in production
app.use("/uploads", express.static("uploads"));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    env: process.env.NODE_ENV,
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/cv", cvRoutes);
app.use("/api/ai", aiRoutes);

// ── 404 + error handlers ──────────────────────────────────────────────────────
// notFound must come after all routes
app.use(notFound);
// errorHandler must be last and must have 4 params (err, req, res, next)
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);
  // Start AI keep-alive pings
  startAiKeepAlive();
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
process.on("SIGINT", () => {
  console.log("🛑 Shutting down server...");

  stopAiKeepAlive();
  server.close(() => {
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received...");

  stopAiKeepAlive();
  server.close(() => {
    process.exit(0);
  });
});

export default app;
