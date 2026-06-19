import useAdminUsers from '../../hooks/admin/useAdminUsers'
import useUserDetail  from '../../hooks/admin/useUserDetail'
import AdminUsersFilterBar from '../../components/admin/AdminUsersFilterBar'
import AdminUsersTable     from '../../components/admin/AdminUsersTable'
import UserDetailPanel     from '../../components/admin/UserDetailPanel'
import Pagination          from '../../components/admin/Pagination'

export default function AdminUsersPage() {
  const {
    users, total, page, pages, limit, filters, loading, isSelf,
    setPage, updateFilter, clearFilters,
    changeRole, changeStatus, deleteUser,
  } = useAdminUsers()

  const { userId, detail, loading: detailLoading, open, close, isOpen } = useUserDetail()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-slate-50 mb-1">Users</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{total} user{total === 1 ? '' : 's'} registered</p>
      </div>

      <AdminUsersFilterBar filters={filters} onChange={updateFilter} onClear={clearFilters} />

      <AdminUsersTable
        users={users}
        loading={loading}
        isSelf={isSelf}
        onChangeRole={changeRole}
        onChangeStatus={changeStatus}
        onDelete={deleteUser}
        onView={open}
      />

      <Pagination page={page} pages={pages} total={total} limit={limit} onChange={setPage} />

      <UserDetailPanel isOpen={isOpen} loading={detailLoading} detail={detail} onClose={close} />
    </div>
  )
}