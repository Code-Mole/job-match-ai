import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useToast } from "../components/ui/Toast";

export default function useApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/applications");
      setApplications(data.applications);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to load applications.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateStatus = async (appliedJobId, status) => {
    try {
      await axios.patch(`/api/applications/${appliedJobId}/status`, { status });
      setApplications((prev) =>
        prev.map((a) => (a._id === appliedJobId ? { ...a, status } : a)),
      );
      showToast("Status updated.", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update status.",
        "error",
      );
    }
  };

  const removeApplication = async (appliedJobId) => {
    try {
      await axios.delete(`/api/applications/${appliedJobId}`);
      setApplications((prev) => prev.filter((a) => a._id !== appliedJobId));
      showToast("Removed from tracker.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove.", "error");
    }
  };

  return {
    applications,
    loading,
    updateStatus,
    removeApplication,
    refetch: fetchApplications,
  };
}
