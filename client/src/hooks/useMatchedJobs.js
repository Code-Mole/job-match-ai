import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { dedupeJobs } from "../utils/dedupeJobs";

/**
 * Top AI-matched jobs from the database for the logged-in user.
 */
export function useMatchedJobs(limit = 15) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatched = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/jobs/match");
      const list = dedupeJobs(
        (data.matches || []).map((m) => ({
          _id: m.job_id,
          title: m.title,
          company: m.company,
          location: m.location,
          salary: m.salary,
          skills: [
            ...(m.matched_skills || []),
            ...(m.missing_skills || []),
          ],
          match_score: m.match_score,
          matchScore: m.match_score,
          matched_skills: m.matched_skills,
          missing_skills: m.missing_skills,
          component_scores: m.component_scores,
        })),
      )
        .filter((j) => j._id)
        .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
        .slice(0, limit);

      setJobs(list);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load matched jobs.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [limit, user?.skills?.length]);

  useEffect(() => {
    fetchMatched();
  }, [fetchMatched]);

  return { jobs, loading, error, refetch: fetchMatched };
}
