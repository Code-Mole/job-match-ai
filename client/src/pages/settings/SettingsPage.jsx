import { useState, useEffect } from "react"
import { User, Bell, Shield, Trash2, Save, Eye, EyeOff, Check, Mail } from 'lucide-react'
import AppLayout from '../../components/layouts/AppLayout'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import axios from 'axios'

const TABS = [
  { id: 'account',       label: 'Account',       icon: User    },
  { id: 'notifications', label: 'Notifications', icon: Bell    },
  { id: 'privacy',       label: 'Privacy',       icon: Shield  },
  { id: 'email',         label: 'Email (SMTP)',  icon: Mail    },
  { id: 'danger',        label: 'Danger zone',   icon: Trash2  },
]

// ── Reusable section wrapper ──────────────────────────────────────────────────
function Section({ title, description, children }) {
  return (
    <div className="surface-card rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

// ── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full overflow-hidden transition-colors duration-200 ${value ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? 'translate-x-[1.375rem]' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}

// ── Account tab ───────────────────────────────────────────────────────────────
function AccountTab() {
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  const [form, setForm]     = useState({ name: user?.name || '', email: user?.email || '', headline: user?.headline || '', location: user?.location || '', bio: user?.bio || '' })
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({})
  const [pwSaving, setPwSaving] = useState(false)

  const saveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({ name: form.name, headline: form.headline, location: form.location, bio: form.bio })
      toast('Profile updated successfully', 'success')
    } catch {
      toast('Failed to update profile', 'error')
    } finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (pwForm.next !== pwForm.confirm) return toast('Passwords do not match', 'error')
    if (pwForm.next.length < 8) return toast('Password must be at least 8 characters', 'error')
    setPwSaving(true)
    try {
      await axios.put('/api/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next })
      toast('Password changed successfully', 'success')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to change password', 'error')
    } finally { setPwSaving(false) }
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          rows={3}
          placeholder={placeholder}
          className="input-field resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          className="input-field"
        />
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <Section title="Personal information" description="Update your public profile details.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('name',     'Full name',  'text', 'Alex Johnson')}
          {field('email',    'Email',      'text', 'you@example.com')}
          {field('headline', 'Headline',   'text', 'Senior Frontend Developer')}
          {field('location', 'Location',   'text', 'San Francisco, CA')}
        </div>
        <div className="mt-4">
          {field('bio', 'Bio', 'textarea', 'Tell employers a bit about yourself…')}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2 px-5">
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
            Save changes
          </button>
        </div>
      </Section>

      <Section title="Change password" description="Use a strong password with letters, numbers, and symbols.">
        <div className="space-y-3">
          {[
            { key: 'current', label: 'Current password' },
            { key: 'next',    label: 'New password'     },
            { key: 'confirm', label: 'Confirm new password' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={showPw[key] ? 'text' : 'password'}
                  value={pwForm[key]}
                  onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                  className="input-field pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-1">
            <button onClick={changePassword} disabled={pwSaving || !pwForm.current || !pwForm.next}
              className="btn-primary flex items-center gap-2 px-5">
              {pwSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield size={15} />}
              Update password
            </button>
          </div>
        </div>
      </Section>
    </div>
  )
}

// ── Notifications tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [prefs, setPrefs] = useState({
    jobMatches:   true,
    weeklyDigest: true,
    skillUpdates: false,
    appStatus:    true,
    marketing:    false,
    browser:      true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.notificationPrefs) {
      setPrefs((p) => ({ ...p, ...user.notificationPrefs }))
    }
  }, [user])

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  const save = async () => {
    setSaving(true)
    try {
      await axios.put('/api/auth/profile', { notificationPrefs: prefs })
      await refreshUser?.()
      toast('Notification preferences saved', 'success')
    } catch {
      toast('Failed to save preferences', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <Section title="Email notifications" description="Choose which emails you want to receive.">
        <ToggleRow label="New job matches" description="Get notified when new jobs match your profile" value={prefs.jobMatches} onChange={() => toggle('jobMatches')} />
        <ToggleRow label="Weekly digest" description="A summary of your top matches every Monday" value={prefs.weeklyDigest} onChange={() => toggle('weeklyDigest')} />
        <ToggleRow label="Skill gap alerts" description="When new learning resources match your gaps" value={prefs.skillUpdates} onChange={() => toggle('skillUpdates')} />
        <ToggleRow label="Application updates" description="Status changes on jobs you've applied to" value={prefs.appStatus} onChange={() => toggle('appStatus')} />
        <ToggleRow label="Tips and promotions" description="Occasional product updates and career tips" value={prefs.marketing} onChange={() => toggle('marketing')} />
      </Section>

      <Section title="Browser notifications" description="Real-time alerts in your browser.">
        <ToggleRow label="Enable browser notifications" description="Requires permission from your browser" value={prefs.browser} onChange={() => toggle('browser')} />
      </Section>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 px-5">
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={15} />}
          Save preferences
        </button>
      </div>
    </div>
  )
}

// ── Privacy tab ───────────────────────────────────────────────────────────────
function PrivacyTab() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [prefs, setPrefs] = useState({ profileVisible: true, showSalaryExpectation: false, allowRecruiterContact: true, dataAnalytics: true })
  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  useEffect(() => {
    if (user?.privacyPrefs) {
      setPrefs((p) => ({ ...p, ...user.privacyPrefs }))
    }
  }, [user])
  const save = async () => {
    try {
      await axios.put('/api/auth/profile', { privacyPrefs: prefs })
      await refreshUser?.()
      toast('Privacy settings saved', 'success')
    } catch { toast('Failed to save', 'error') }
  }

  return (
    <div className="space-y-5">
      <Section title="Profile visibility" description="Control who can see your profile.">
        <ToggleRow label="Public profile" description="Recruiters and companies can find your profile" value={prefs.profileVisible} onChange={() => toggle('profileVisible')} />
        <ToggleRow label="Show salary expectation" description="Display your preferred salary range to employers" value={prefs.showSalaryExpectation} onChange={() => toggle('showSalaryExpectation')} />
        <ToggleRow label="Allow recruiter contact" description="Recruiters can send you direct messages" value={prefs.allowRecruiterContact} onChange={() => toggle('allowRecruiterContact')} />
      </Section>
      <Section title="Data & analytics" description="Control how your data is used to improve the service.">
        <ToggleRow label="Usage analytics" description="Help us improve JobMatch AI with anonymous usage data" value={prefs.dataAnalytics} onChange={() => toggle('dataAnalytics')} />
      </Section>
      <div className="flex justify-end">
        <button onClick={save} className="btn-primary flex items-center gap-2 px-5">
          <Check size={15} /> Save settings
        </button>
      </div>
    </div>
  )
}

// ── Email / SMTP tab ──────────────────────────────────────────────────────────
function EmailTab() {
  const toast = useToast()
  const [status, setStatus] = useState(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    axios.get('/api/auth/settings/email-status')
      .then(({ data }) => setStatus(data))
      .catch(() => setStatus({ configured: false }))
  }, [])

  const sendTest = async () => {
    setTesting(true)
    try {
      const { data } = await axios.post('/api/auth/settings/test-email')
      toast(data.message || 'Test email sent', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'SMTP test failed', 'error')
    } finally { setTesting(false) }
  }

  return (
    <div className="space-y-5">
      <Section
        title="Application confirmation emails"
        description="SMTP for application confirmation emails (use Gmail, Resend, or Mailgun). Configure these in server/.env — the app reads them at startup."
      >
        <div className={`p-4 rounded-xl text-sm ${status?.configured ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50'}`}>
          {status?.configured
            ? `✓ SMTP is configured (${status.host}). Emails send from ${status.from || 'your SMTP user'}.`
            : 'SMTP is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to server/.env'}
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
          <p>SMTP_HOST=smtp.gmail.com</p>
          <p>SMTP_PORT=587</p>
          <p>SMTP_USER=your-email@gmail.com</p>
          <p>SMTP_PASS=your-app-password</p>
          <p className="text-xs font-sans text-slate-500 pt-2">For Gmail: use an App Password (2FA required). Resend/Mailgun: use their SMTP host and API key as password.</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={sendTest}
            disabled={testing || !status?.configured}
            className="btn-primary flex items-center gap-2 px-5 disabled:opacity-50"
          >
            {testing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mail size={15} />}
            Send test email to my account
          </button>
        </div>
      </Section>
    </div>
  )
}

// ── Danger zone tab ───────────────────────────────────────────────────────────
function DangerTab() {
  const { logout } = useAuth()
  const toast = useToast()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const deleteAccount = async () => {
    if (confirmText !== 'DELETE') return toast('Type DELETE to confirm', 'error')
    setDeleting(true)
    try {
      await axios.delete('/api/auth/account')
      toast('Account deleted', 'info')
      logout()
    } catch {
      toast('Failed to delete account. Contact support.', 'error')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <Section title="Export your data" description="Download a copy of all your data including profile, skills, and job history.">
        <button
          onClick={async () => {
            try {
              const { data } = await axios.get('/api/auth/export')
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url  = URL.createObjectURL(blob)
              const a    = document.createElement('a'); a.href = url; a.download = 'jobmatch-data.json'; a.click()
              URL.revokeObjectURL(url)
              toast('Data exported successfully', 'success')
            } catch { toast('Export failed', 'error') }
          }}
          className="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
        >
          Export data as JSON
        </button>
      </Section>

      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-red-200 dark:border-red-800/50">
          <h3 className="font-semibold text-red-800 dark:text-red-300">Delete account</h3>
          <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">This action is permanent and cannot be undone.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Deleting your account will permanently remove your profile, CV, skills, job history, and all saved data.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="input-field max-w-xs"
            />
          </div>
          <button
            onClick={deleteAccount}
            disabled={confirmText !== 'DELETE' || deleting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {deleting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={15} />}
            Delete my account
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TAB_IDS = new Set(TABS.map((t) => t.id))

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    return TAB_IDS.has(tab) ? tab : 'account'
  })

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (tab && TAB_IDS.has(tab)) setActiveTab(tab)
  }, [])

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-display font-bold text-3xl text-slate-900 dark:text-slate-50 mb-8">Settings</h1>
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">

          {/* Sidebar tabs */}
          <nav className="flex flex-row lg:flex-col gap-1 lg:bg-white lg:dark:bg-slate-800 lg:rounded-2xl lg:border lg:border-slate-200 lg:dark:border-white/8 lg:p-2 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap
                  transition-all text-left w-full
                  ${activeTab === id
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }
                  ${id === 'danger' && activeTab !== 'danger' ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : ''}
                `}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <div>
            {activeTab === 'account'       && <AccountTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'privacy'       && <PrivacyTab />}
            {activeTab === 'email'         && <EmailTab />}
            {activeTab === 'danger'        && <DangerTab />}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}