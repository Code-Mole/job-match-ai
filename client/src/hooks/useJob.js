import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";   

export function useJob(jobId) {
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [gap, setGap] = useState(null); // skill gap analysis from AI
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
        try {
          const gapRes = await axios.post("/api/ai/skill-gap", {
            user_skills: user?.skills || [],
            job_id: jobId,
            job: data.job,
          });
          setGap(gapRes.data);
        } catch {
          // Gap analysis is optional — don't block the page
          setGap(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Job not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [jobId, user?.skills]);

  return { job, gap, loading, error };
}
