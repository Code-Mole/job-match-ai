import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { dedupeJobs } from "../utils/dedupeJobs";
import { cachedGet } from "../utils/apiCache";

/**
 * Top AI-matched jobs — uses fast match endpoint with limited pool.
 */
export function useMatchedJobs(limit = 12) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatched = useCallback(async () => {
    if (!user) {
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = `/api/jobs/match?limit=${limit}&top_n=${limit}`;
      const profileKey = [
        user._id,
        user.cvUploadedAt || 'none',
        (user.skills || []).length,
      ].join('::');
      const data = await cachedGet(url, 60_000, null, `${url}::${profileKey}`);

      const list = dedupeJobs(
        (data.matches || []).map((m) => ({
          _id: m.job_id,
          title: m.title,
          company: m.company,
          location: m.location,
          salary: m.salary,
          skills: m.skills?.length
            ? m.skills
            : [...(m.matched_skills || []), ...(m.missing_skills || [])],
          match_score: m.match_score,
          matchScore: m.match_score,
          matched_skills: m.matched_skills,
          missing_skills: m.missing_skills,
          component_scores: m.component_scores,
          match_factors: m.match_factors,
          match_summary: m.match_summary,
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
  }, [limit, user?._id]);

  useEffect(() => {
    fetchMatched();
  }, [fetchMatched]);

  return { jobs, loading, error, refetch: fetchMatched };
}
