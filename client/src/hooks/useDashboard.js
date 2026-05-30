import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { useToast } from '../components/ui/Toast'
import { dedupeJobs } from '../utils/dedupeJobs'
import { cachedGet, invalidateCache } from '../utils/apiCache'

export function useDashboard() {
  const toast = useToast()

  const [jobs, setJobs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError]         = useState(null)
  const [stats, setStats]         = useState(null)
  const abortRef                  = useRef(null)

  // ── Fetch jobs with embedded AI scores in one request ─────────────────────
  const fetchMatches = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else         setAiLoading(true)
    setError(null)

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      // Try to get AI-scored matches first
      let matched = []
      try {
        const data = await cachedGet(
          '/api/jobs/match?limit=8&top_n=8',
          90_000,
          () => axios.get('/api/jobs/match?limit=8&top_n=8', { signal: abortRef.current.signal }),
        )
        matched = (data.matches || []).map(m => ({
          _id:           m.job_id,
          title:         m.title,
          company:       m.company,
          location:      m.location,
          salary:        m.salary,
          type:          m.type,
          remote:        m.remote,
          level:         m.level,
          matchScore:    m.match_score,
          matchedSkills: m.matched_skills  || [],
          missingSkills: m.missing_skills  || [],
          componentScores: m.component_scores || {},
        }))
      } catch (aiErr) {
        if (aiErr.name === 'CanceledError') return
        // AI unavailable — fall back to plain job list
        const { data } = await axios.get('/api/jobs?limit=8&sort=-postedAt', {
          signal: abortRef.current.signal,
        })
        matched = (data.jobs || []).map(j => ({ ...j, matchScore: null }))
      }

      setJobs(dedupeJobs(matched))

      // ── Fetch stats ───────────────────────────────────────────────────────
      try {
        const { data: statsData } = await axios.get('/api/auth/stats')
        setStats(statsData)
      } catch { /* non-critical */ }

    } catch (err) {
      if (err.name === 'CanceledError') return
      const msg = err.response?.data?.message || 'Failed to load job matches.'
      setError(msg)
      if (!silent) toast(msg, 'error')
    } finally {
      setLoading(false)
      setAiLoading(false)
    }
  }, [toast])

  // ── Called immediately after CV upload succeeds ───────────────────────────
  // Accepts the top_matches array returned by /api/cv/parse
  const injectCvMatches = useCallback((topMatches) => {
    if (!topMatches?.length) return
    invalidateCache('/api/jobs/match')
    invalidateCache('/api/auth/career-insights')
    setJobs(dedupeJobs(topMatches).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)))
  }, [])

  useEffect(() => {
    fetchMatches()
    return () => abortRef.current?.abort()
  }, [fetchMatches])

  return {
    jobs,
    loading,
    aiLoading,
    error,
    stats,
    refetch:        () => fetchMatches(false),
    refetchSilent:  () => fetchMatches(true),
    injectCvMatches,
  }
}