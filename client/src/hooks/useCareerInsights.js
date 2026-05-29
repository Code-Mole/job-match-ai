import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { CAREER_ROLES } from "../data/careersData";

export function useCareerInsights() {
  const [roles, setRoles] = useState(CAREER_ROLES);
  const [careerPaths, setCareerPaths] = useState([]);
  const [marketSummary, setMarketSummary] = useState(null);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/auth/career-insights");
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
  }, []);

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
