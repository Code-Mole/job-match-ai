import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useToast } from "../../components/ui/Toast";

const DEFAULT_FILTERS = {
  search: "",
  country: "",
  source: "",
  isActive: "",
  featured: "",
};

export default function useAdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const { showToast } = useToast();
  const debounceRef = useRef(null);

  const buildParams = useCallback(
    (overridePage) => {
      const params = { page: overridePage || page, limit };
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== "") params[key] = val;
      });
      return params;
    },
    [filters, page],
  );

  const fetchJobs = useCallback(
    async (overridePage) => {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/admin/jobs", {
          params: buildParams(overridePage),
        });
        setJobs(data.jobs);
        setTotal(data.total);
        setPages(data.pages);
      } catch (err) {
        showToast(
          err.response?.data?.message || "Failed to load jobs.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [buildParams, showToast],
  );

  // Debounce search input specifically — other filters apply immediately
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchJobs(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  // Non-search filter changes and page changes apply immediately
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.country,
    filters.source,
    filters.isActive,
    filters.featured,
    page,
  ]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== "search") setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const toggleFeatured = async (jobId, current) => {
    try {
      const { data } = await axios.patch(`/api/admin/jobs/${jobId}/featured`, {
        featured: !current,
      });
      setJobs((prev) =>
        prev.map((j) =>
          j._id === jobId ? { ...j, featured: data.featured } : j,
        ),
      );
      showToast(data.message, "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update featured status.",
        "error",
      );
    }
  };

  const deleteJob = async (jobId, permanent = false) => {
    try {
      const { data } = await axios.delete(`/api/admin/jobs/${jobId}`, {
        params: { permanent },
      });
      if (permanent) {
        setJobs((prev) => prev.filter((j) => j._id !== jobId));
        setTotal((prev) => prev - 1);
      } else {
        setJobs((prev) =>
          prev.map((j) => (j._id === jobId ? { ...j, isActive: false } : j)),
        );
      }
      showToast(data.message, "success");
      return true;
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete job.",
        "error",
      );
      return false;
    }
  };

  const reactivateJob = async (jobId) => {
    try {
      const { data } = await axios.put(`/api/admin/jobs/${jobId}`, {
        isActive: true,
      });
      setJobs((prev) => prev.map((j) => (j._id === jobId ? data.job : j)));
      showToast("Job reactivated.", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to reactivate job.",
        "error",
      );
    }
  };

  return {
    jobs,
    total,
    page,
    pages,
    limit,
    filters,
    loading,
    setPage,
    updateFilter,
    clearFilters,
    toggleFeatured,
    deleteJob,
    reactivateJob,
    refetch: () => fetchJobs(),
  };
}
