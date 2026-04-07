import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const DEFAULT_FILTERS = {
  search: "",
  location: "",
  type: "",
  level: "",
  remote: false,
  salaryMin: "",
  salaryMax: "",
  sort: "match", // 'match' | 'salary' | 'recent'
  page: 1,
};

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [aiScores, setAiScores] = useState({}); // jobId → {match_score, component_scores, matched_skills, missing_skills}
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // Debounce search — wait 400ms after last keystroke before fetching
  const searchTimer = useRef(null);

  // ── Fetch jobs from Express backend ────────────────────────────────────────
  const fetchJobs = useCallback(
    async (f = filters) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (f.search) params.set("search", f.search);
        if (f.location) params.set("location", f.location);
        if (f.type) params.set("type", f.type);
        if (f.level) params.set("level", f.level);
        if (f.remote) params.set("remote", "true");
        if (f.salaryMin) params.set("salaryMin", f.salaryMin);
        if (f.salaryMax) params.set("salaryMax", f.salaryMax);
        params.set("page", f.page);
        params.set("limit", "12");
        // Sort by salary for that option, otherwise by date (AI score sorts client-side)
        if (f.sort === "salary") params.set("sort", "-salaryMax");
        else if (f.sort === "recent") params.set("sort", "-postedAt");

        const { data } = await axios.get(`/api/jobs?${params}`);
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  // ── Fetch AI match scores from Flask via Express ────────────────────────────
  const fetchAiScores = useCallback(async () => {
    setAiLoading(true);
    try {
      const { data } = await axios.get("/api/jobs/match");
      // Build a lookup map: jobId → score data
      const scoreMap = {};
      for (const match of data.matches || []) {
        scoreMap[match.job_id] = {
          matchScore: match.match_score,
          componentScores: match.component_scores,
          matchedSkills: match.matched_skills,
          missingSkills: match.missing_skills,
        };
      }
      setAiScores(scoreMap);
    } catch (err) {
      // AI scores are non-critical — silently fail and show jobs without scores
      console.warn("AI scores unavailable:", err.message);
    } finally {
      setAiLoading(false);
    }
  }, []);

  // ── Merge AI scores into job objects ────────────────────────────────────────
  const jobsWithScores = jobs.map((job) => ({
    ...job,
    ...(aiScores[job._id] || { matchScore: null }),
  }));

  // Sort client-side by match score if that's the selected sort
  const sortedJobs =
    filters.sort === "match"
      ? [...jobsWithScores].sort(
          (a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0),
        )
      : jobsWithScores;

  // ── Filter change handler — debounces search field ─────────────────────────
  const updateFilter = useCallback(
    (key, value) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value, page: 1 };

        if (key === "search") {
          // Debounce search to avoid a fetch on every keystroke
          clearTimeout(searchTimer.current);
          searchTimer.current = setTimeout(() => fetchJobs(next), 400);
          return next;
        }

        fetchJobs(next);
        return next;
      });
    },
    [fetchJobs],
  );

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    fetchJobs(DEFAULT_FILTERS);
  };

  const goToPage = (p) => {
    const next = { ...filters, page: p };
    setFilters(next);
    fetchJobs(next);
  };

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchJobs();
    fetchAiScores();
  }, []);

  return {
    jobs: sortedJobs,
    filters,
    updateFilter,
    resetFilters,
    loading,
    aiLoading,
    error,
    total,
    pages,
    goToPage,
    refetchScores: fetchAiScores,
  };
}
