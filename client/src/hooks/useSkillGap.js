import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";

export function useSkillGap(jobId = null) {
  const { user } = useAuth();
  const [gap, setGap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchGap = useCallback(
    async (id) => {
      if (!id) {
        setGap(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.post("/api/ai/skill-gap", {
          user_skills: user?.skills || [],
          job_id: id,
        });
        setGap(data);
      } catch (err) {
        const msg =
          err.response?.data?.message || "Failed to load skill gap analysis.";
        setError(msg);
        setGap(null);
        toast(msg, "error");
      } finally {
        setLoading(false);
      }
    },
    [user?.skills, toast],
  );

  useEffect(() => {
    fetchGap(jobId);
  }, [jobId, fetchGap]);

  return { gap, loading, error, refetch: () => fetchGap(jobId) };
}

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
