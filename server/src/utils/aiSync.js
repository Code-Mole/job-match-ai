/**
 * Shared helper for reloading the Flask AI service's in-memory job
 * corpus after any mutation that changes the set of active jobs.
 *
 * This is fire-and-forget: failures are logged but never block or
 * fail the calling admin request. The AI service may be cold-starting
 * (see cold-start mitigation strategy), and the matching engine has
 * its own periodic reload as a fallback via the Express /api/jobs/match
 * route, which reloads jobs on every request anyway.
 */

import axios from "axios";
import Job from "../models/Job.js";

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

async function reloadMatcherJobs() {
  try {
    const jobs = await Job.find({ isActive: true }).lean().limit(200);
    await axios.post(`${AI_URL}/load-jobs`, { jobs }, { timeout: 8000 });
    console.log(`🔄 AI matcher reloaded with ${jobs.length} active jobs`);
    return true;
  } catch (err) {
    console.warn("AI matcher reload skipped:", err.message);
    return false;
  }
}

 export default reloadMatcherJobs 
