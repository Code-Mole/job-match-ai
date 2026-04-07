import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export function useSkillGap(jobId = null, jobData = null) {
  const { user } = useAuth();
  const [gap, setGap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGap = useCallback(
    async (jId, jData) => {
      if (!jId && !jData) return;
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.post("/api/ai/skill-gap", {
          user_skills: user?.skills || [],
          job_id: jId || undefined,
          job: jData || undefined,
        });
        setGap(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load skill gap analysis.",
        );
      } finally {
        setLoading(false);
      }
    },
    [user?.skills],
  );

  useEffect(() => {
    fetchGap(jobId, jobData);
  }, [jobId, jobData, fetchGap]);

  return { gap, loading, error, refetch: () => fetchGap(jobId, jobData) };
}

// Hook for getting the full skill profile of the logged-in user
export function useUserSkills() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const addSkill = async (skill) => {
    if (!skill?.trim() || user?.skills?.includes(skill)) return;
    setSaving(true);
    try {
      await updateProfile({ skills: [...(user?.skills || []), skill.trim()] });
    } finally {
      setSaving(false);
    }
  };

  const removeSkill = async (skill) => {
    setSaving(true);
    try {
      await updateProfile({
        skills: (user?.skills || []).filter((s) => s !== skill),
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    skills: user?.skills || [],
    addSkill,
    removeSkill,
    saving,
  };
}
