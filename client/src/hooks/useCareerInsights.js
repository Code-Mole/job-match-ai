import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { CAREER_ROLES } from "../data/careersData";
import { cachedGet } from "../utils/apiCache";

export function useCareerInsights() {
  const { user } = useAuth();
  const [roles, setRoles] = useState(CAREER_ROLES);
  const [careerPaths, setCareerPaths] = useState([]);
  const [marketSummary, setMarketSummary] = useState(null);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cachedGet("/api/auth/career-insights", 120_000);
      if (data.roles?.length) setRoles(data.roles);
      if (data.careerPaths?.length) setCareerPaths(data.careerPaths);
      setMarketSummary(data.marketSummary || null);
      setPersonalized(!!data.personalized);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load career insights.");
      setRoles(CAREER_ROLES);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    roles,
    careerPaths,
    marketSummary,
    personalized,
    loading,
    error,
    refetch: fetchInsights,
  };
}
