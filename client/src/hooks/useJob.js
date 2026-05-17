import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";   

export function useJob(jobId) {
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [gap, setGap] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [componentScores, setComponentScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch job details from Express
        const { data } = await axios.get(`/api/jobs/${jobId}`);
        setJob(data.job);

        // Fetch skill gap from AI service via Express
        if (user?.skills?.length) {
          try {
            const gapRes = await axios.post("/api/ai/skill-gap", {
              user_skills: user.skills,
              job_id: jobId,
              job: data.job,
            });
            setGap(gapRes.data);
          } catch {
            setGap(null);
          }

          try {
            const matchRes = await axios.get("/api/jobs/match");
            const hit = (matchRes.data.matches || []).find(
              (m) => String(m.job_id) === String(jobId),
            );
            if (hit?.match_score != null) {
              setMatchScore(hit.match_score);
              setComponentScores(hit.component_scores || null);
            }
          } catch {
            /* optional */
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Job not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [jobId, user?.skills]);

  return { job, gap, matchScore, componentScores, loading, error };
}
