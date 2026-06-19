import { useState } from 'react'
import axios from 'axios'
import { useToast } from '../../components/ui/Toast'

export default function useBulkImport() {
  const [raw, setRaw]           = useState('')
  const [parsed, setParsed]     = useState(null)   // array | null
  const [parseError, setParseError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]     = useState(null)
  const { showToast } = useToast()

  const validateLocal = (jobs) => {
    return jobs.map((job, i) => {
      const errs = []
      if (!job.title?.trim())       errs.push('missing title')
      if (!job.company?.trim())     errs.push('missing company')
      if (!job.location?.trim())    errs.push('missing location')
      if (!job.description?.trim()) errs.push('missing description')
      if (job.skills && !Array.isArray(job.skills)) errs.push('skills must be an array')
      return { index: i, title: job.title || '(untitled)', errors: errs }
    })
  }

  const parse = () => {
    setResult(null)
    try {
      const data = JSON.parse(raw)
      if (!Array.isArray(data)) {
        setParseError('JSON must be an array of job objects, e.g. [ { "title": "...", ... } ]')
        setParsed(null)
        return
      }
      if (data.length === 0) {
        setParseError('The array is empty — add at least one job.')
        setParsed(null)
        return
      }
      if (data.length > 500) {
        setParseError(`${data.length} jobs found — maximum 500 per import.`)
        setParsed(null)
        return
      }
      setParseError('')
      setParsed(data)
    } catch (err) {
      setParseError(`Invalid JSON: ${err.message}`)
      setParsed(null)
    }
  }

  const localValidation = parsed ? validateLocal(parsed) : []
  const localErrorCount = localValidation.filter(r => r.errors.length > 0).length

  const submit = async () => {
    if (!parsed) return
    setSubmitting(true)
    try {
      const { data } = await axios.post('/api/admin/jobs/bulk', { jobs: parsed })
      setResult(data)
      showToast(data.message, data.failed > 0 ? 'info' : 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Bulk import failed.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setRaw(''); setParsed(null); setParseError(''); setResult(null)
  }

  return {
    raw, setRaw, parse, parsed, parseError,
    localValidation, localErrorCount,
    submit, submitting, result, reset,
  }
}