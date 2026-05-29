import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useToast } from "../components/ui/Toast";
import { dedupeJobs } from "../utils/dedupeJobs";

const DEFAULT_FILTERS = {
  search: "",
  location: "",
  type: "",
  level: "",
  remote: false,
  salaryMin: "",
  salaryMax: "",
  sort: "match",
  page: 1,
};

function buildParams(f) {
  const params = new URLSearchParams();
  if (f.search) params.set("search", f.search);
  if (f.location) params.set("location", f.location);
  if (f.type) params.set("type", f.type);
  if (f.level) params.set("level", f.level);
  if (f.remote) params.set("remote", "true");
  if (f.salaryMin) params.set("salaryMin", f.salaryMin);
  if (f.salaryMax) params.set("salaryMax", f.salaryMax);
  params.set("page", String(f.page));
  params.set("limit", "12");
  return params;
}

export function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const searchTimer = useRef(null);
  const toast = useToast();

  const fetchJobs = useCallback(async (f = filters) => {
    setLoading(true);
    setError(null);

    const isMatchSort = f.sort === "match";

    try {
      const params = buildParams(f);

      if (isMatchSort) {
        setAiLoading(true);
        const { data } = await axios.get(`/api/jobs/match?${params}`);
        const scored = (data.matches || []).map((m) => ({
          _id: m.job_id,
          title: m.title,
          company: m.company,
          location: m.location,
          salary: m.salary,
          type: m.type,
          remote: m.remote,
          level: m.level,
          industry: m.industry,
          applyUrl: m.applyUrl,
          skills: m.skills,
          matchScore: m.match_score,
          matchedSkills: m.matched_skills,
          missingSkills: m.missing_skills,
          componentScores: m.component_scores,
        }));
        setJobs(dedupeJobs(scored));
        setTotal(data.total ?? scored.length);
        setPages(data.pages ?? 1);
        setAiLoading(false);
        return;
      }

      if (f.sort === "salary") params.set("sort", "-salaryMax");
      else if (f.sort === "recent") params.set("sort", "-postedAt");

      const { data } = await axios.get(`/api/jobs?${params}`);
      setJobs(
        dedupeJobs(
          (data.jobs || []).map((j) => ({ ...j, matchScore: j.matchScore ?? null })),
        ),
      );
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load jobs.");
      toast(err.response?.data?.message || "Failed to load jobs.", "error");
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  }, [filters, toast]);

  const updateFilter = useCallback(
    (key, value) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value, page: 1 };

        if (key === "search") {
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

  useEffect(() => {
    fetchJobs();
    return () => clearTimeout(searchTimer.current);
  }, []);

  return {
    jobs,
    filters,
    updateFilter,
    resetFilters,
    loading,
    aiLoading,
    error,
    total,
    pages,
    goToPage,
    refetch: () => fetchJobs(filters),
  };
}
