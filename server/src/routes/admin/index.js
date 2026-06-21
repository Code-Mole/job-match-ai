import express  from "express";
import { protect, adminOnly }  from "../../middleware/auth.js";
import Job from "./jobs.js";
import Users from "./users.js";
import stats from "./stats.js";
import feedbackAdminRoutes from "./feedback.js";

const router = express.Router();
// Every route under /api/admin requires a valid, active admin account.
// 401 if not authenticated, 403 if authenticated but role !== 'admin'.
router.use(protect, adminOnly);

router.use("/jobs", Job);
router.use("/users", Users);
router.use("/stats", stats);
router.use("/feedback", feedbackAdminRoutes)

export default router;
