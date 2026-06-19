import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useToast } from "../../components/ui/Toast";

export default function useAdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/admin/stats");
      setStats(data);
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to load dashboard statistics.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
