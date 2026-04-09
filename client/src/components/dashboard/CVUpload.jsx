import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ui/Toast'
import axios from 'axios'

const ACCEPTED_EXT = ['.pdf', '.docx', '.txt']

const STEPS = [
  { at: 15, label: 'Uploading file…'      },
  { at: 35, label: 'Extracting text…'     },
  { at: 55, label: 'Identifying skills…'  },
  { at: 75, label: 'Scoring job matches…' },
  { at: 95, label: 'Finalising…'          },
]

export default function CVUpload({ onUpload }) {
  const { refreshUser } = useAuth()
  const toast = useToast()

  const [dragOver, setDragOver]     = useState(false)
  const [file, setFile]             = useState(null)
  const [status, setStatus]         = useState('idle')
  const [progress, setProgress]     = useState(0)
  const [stepLabel, setStepLabel]   = useState('')
  const [errorMsg, setErrorMsg]     = useState('')
  const [parsedData, setParsedData] = useState(null)

  const processFile = useCallback(async (f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXT.includes(ext)) {
      setStatus('error')
      setErrorMsg('Please upload a PDF, DOCX, or TXT file.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setStatus('error')
      setErrorMsg('File is too large. Maximum 10 MB.')
      return
    }

    setFile(f)
    setStatus('uploading')
    setErrorMsg('')
    setProgress(10)
    setStepLabel('Uploading file…')

    // Fake progress ticker so the bar advances visually while server works
    let fakePct = 10
    const ticker = setInterval(() => {
      fakePct = Math.min(fakePct + 2, 90)
      setProgress(fakePct)
      const step = [...STEPS].reverse().find(s => s.at <= fakePct)
      if (step) setStepLabel(step.label)
    }, 700)

    try {
      const form = new FormData()
      form.append('file', f)

      const { data } = await axios.post('/api/cv/parse', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      })

      clearInterval(ticker)

      // ── Sync the user context so skills appear everywhere instantly ─────────
      await refreshUser()

      setProgress(100)
      setStepLabel('Done!')
      setParsedData(data)
      setStatus('success')

      toast(
        data.skills?.length
          ? `CV analysed! ${data.skills.length} skills extracted.`
          : 'CV uploaded. No skills detected — try a clearer PDF.',
        'success'
      )

      // Pass data up to parent (DashboardPage) to inject match cards
      onUpload?.(f, data)

    } catch (err) {
      clearInterval(ticker)

      let msg = 'Upload failed. Please try again.'
      if (err.code === 'ECONNABORTED')       msg = 'Server took too long. Please retry.'
      else if (err.response?.status === 401) msg = 'Session expired. Please log in again.'
      else if (err.response?.status === 503) msg = 'AI service starting up. File saved — retry in 30s.'
      else if (err.response?.data?.message)  msg = err.response.data.message

      setStatus('error')
      setErrorMsg(msg)
      setProgress(0)
      toast(msg, 'error')
    }
  }, [refreshUser, onUpload, toast])

  const handleDrop = useCallback(e => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }, [processFile])

  const handleInput = e => {
    const f = e.target.files[0]
    if (f) processFile(f)
    e.target.value = ''
  }

  const reset = () => {
    setFile(null); setStatus('idle'); setProgress(0)
    setStepLabel(''); setErrorMsg(''); setParsedData(null)
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="rounded-2xl p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
              CV analysed successfully!
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 truncate mt-0.5">{file?.name}</p>

            {parsedData?.skills?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
                  {parsedData.skills.length} skills extracted and saved to your profile:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {parsedData.skills.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsedData?.top_matches?.length > 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2 font-medium">
                ✓ {parsedData.top_matches.length} job matches found — showing below.
              </p>
            )}

            {!parsedData?.ai_available && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                ⚠ Basic extraction used — start the Flask service for better results.
              </p>
            )}
          </div>
          <button onClick={reset} className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── Uploading ────────────────────────────────────────────────────────────────
  if (status === 'uploading') {
    return (
      <div className="rounded-2xl p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
            <Loader2 size={20} className="text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 truncate">{file?.name}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{stepLabel}</p>
          </div>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
        </div>
        <div className="h-2 bg-blue-200 dark:bg-blue-800/50 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-blue-400 dark:text-blue-600 mt-2 text-center">This may take up to 30 seconds</p>
      </div>
    )
  }

  // ── Idle / Error ─────────────────────────────────────────────────────────────
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById('cv-file-input').click()}
      className={`
        relative rounded-2xl p-8 text-center cursor-pointer border-2 border-dashed transition-all duration-200
        ${dragOver
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-600/10 scale-[1.01]'
          : status === 'error'
          ? 'border-red-300 dark:border-red-700/50 bg-red-50 dark:bg-red-900/10'
          : 'border-slate-300 dark:border-white/12 bg-white dark:bg-slate-800/40 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:border-blue-500/50'
        }
      `}
    >
      <input id="cv-file-input" type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleInput} />
      <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${dragOver ? 'bg-blue-100 dark:bg-blue-600/20' : status === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-700/60'}`}>
        {status === 'error'
          ? <AlertCircle size={28} className="text-red-500" />
          : <Upload size={28} className={dragOver ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500'} />
        }
      </div>
      {status === 'error' ? (
        <>
          <p className="font-semibold text-red-700 dark:text-red-400 text-sm mb-1">{errorMsg}</p>
          <p className="text-xs text-red-500">Click to try again</p>
        </>
      ) : (
        <>
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">
            {dragOver ? 'Drop your CV here' : 'Upload Your CV'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Drag & drop or click to browse</p>
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-3 py-1.5 rounded-full">
            <FileText size={11} /> PDF, DOCX, TXT — max 10 MB
          </div>
        </>
      )}
    </div>
  )
}