import { useNavigate } from 'react-router-dom'
import { Plus, Upload } from 'lucide-react'
import useAdminJobs from '../../hooks/admin/useAdminJobs'
import AdminJobsFilterBar from '../../components/admin/AdminJobsFilterBar'
import AdminJobsTable     from '../../components/admin/AdminJobsTable'
import Pagination         from '../../components/admin/Pagination'

export default function AdminJobsPage() {
  const navigate = useNavigate()
  const {
    jobs, total, page, pages, limit, filters, loading,
    setPage, updateFilter, clearFilters,
    toggleFeatured, deleteJob, reactivateJob,
  } = useAdminJobs()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-50 mb-1">
            Jobs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {total} job{total === 1 ? '' : 's'} in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/jobs/bulk-import')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <Upload size={15} /> Bulk import
          </button>
          <button
            onClick={() => navigate('/admin/jobs/new')}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={15} /> Add job
          </button>
        </div>
      </div>

      <AdminJobsFilterBar filters={filters} onChange={updateFilter} onClear={clearFilters} />

      <AdminJobsTable
        jobs={jobs}
        loading={loading}
        onToggleFeatured={toggleFeatured}
        onDelete={deleteJob}
        onReactivate={reactivateJob}
      />

      <Pagination page={page} pages={pages} total={total} limit={limit} onChange={setPage} />
    </div>
  )
}