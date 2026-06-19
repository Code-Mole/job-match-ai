import { useState } from "react";
import {
  ShieldCheck,
  ShieldOff,
  UserX,
  UserCheck,
  Trash2,
  Eye,
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";

export default function AdminUsersTable({
  users,
  loading,
  isSelf,
  onChangeRole,
  onChangeStatus,
  onDelete,
  onView,
}) {
  const [confirmAction, setConfirmAction] = useState(null); // { type, user }
  const [working, setWorking] = useState(false);

  const runConfirmed = async () => {
    setWorking(true);
    let ok = false;
    const { type, user } = confirmAction;
    if (type === "promote") ok = await onChangeRole(user._id, "admin");
    if (type === "demote") ok = await onChangeRole(user._id, "user");
    if (type === "deactivate") ok = await onChangeStatus(user._id, false);
    if (type === "delete") ok = await onDelete(user._id);
    setWorking(false);
    if (ok) setConfirmAction(null);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-8 text-center text-sm text-slate-400">
        Loading users…
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl p-10 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No users match the current filters.
        </p>
      </div>
    );
  }

  const modalConfig =
    {
      promote: {
        title: "Promote to admin?",
        message: `${confirmAction?.user.name} will gain full access to the admin dashboard.`,
        label: "Promote",
        danger: false,
      },
      demote: {
        title: "Remove admin access?",
        message: `${confirmAction?.user.name} will lose access to the admin dashboard.`,
        label: "Remove admin",
        danger: true,
      },
      deactivate: {
        title: "Deactivate this user?",
        message: `${confirmAction?.user.name} will be unable to log in until reactivated.`,
        label: "Deactivate",
        danger: true,
      },
      delete: {
        title: "Permanently delete user?",
        message: `This will permanently remove ${confirmAction?.user.name}'s account and all associated data. This cannot be undone.`,
        label: "Delete permanently",
        danger: true,
      },
    }[confirmAction?.type] || {};

  return (
    <>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/8 text-left">
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                  User
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                  Role
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                  Joined
                </th>
                <th className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = isSelf(u._id);
                return (
                  <tr
                    key={u._id}
                    className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                            {u.name}
                            {self && (
                              <span className="text-xs text-violet-500 ml-1.5">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          u.role === "admin"
                            ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          u.isActive
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onView(u._id)}
                          title="View profile"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        >
                          <Eye size={15} />
                        </button>

                        {u.role === "admin" ? (
                          <button
                            disabled={self}
                            onClick={() =>
                              setConfirmAction({ type: "demote", user: u })
                            }
                            title={
                              self
                                ? "Can't change your own role"
                                : "Remove admin access"
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            <ShieldOff size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmAction({ type: "promote", user: u })
                            }
                            title="Promote to admin"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                          >
                            <ShieldCheck size={15} />
                          </button>
                        )}

                        {u.isActive ? (
                          <button
                            disabled={self}
                            onClick={() =>
                              setConfirmAction({ type: "deactivate", user: u })
                            }
                            title={
                              self
                                ? "Can't deactivate your own account"
                                : "Deactivate"
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            <UserX size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => onChangeStatus(u._id, true)}
                            title="Reactivate"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <UserCheck size={15} />
                          </button>
                        )}

                        <button
                          disabled={self}
                          onClick={() =>
                            setConfirmAction({ type: "delete", user: u })
                          }
                          title={
                            self
                              ? "Can't delete your own account"
                              : "Delete permanently"
                          }
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmLabel={modalConfig.label}
        danger={modalConfig.danger}
        loading={working}
        onConfirm={runConfirmed}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
