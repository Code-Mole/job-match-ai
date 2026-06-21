import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedLayout from "./components/layouts/ProtectedLayout";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import AuthCallbackPage from "./pages/auth/AuthCallbackPage";
import MyJobsPage from "./pages/jobs/MyJobsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import JobsPage from "./pages/jobs/JobsPage";
import JobDetailPage from "./pages/jobs/JobDetailPage";
import CareersPage from "./pages/careers/CareersPage";
import SkillsPage from "./pages/skills/SkillsPage";
import AssistantPage from "./pages/assistant/AssistantPage";
import SettingsPage from "./pages/settings/SettingsPage";
import LandingPage from "./pages/landing/LandingPage";
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/layouts/AdminLayout";
import AdminOverviewPage from "./pages/admin/adminOverviewPage";
import AdminJobsPage from "./pages/admin/AdminJobsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminJobFormPage from "./pages/admin/AdminJobFormPage";
import AdminBulkImportPage from "./pages/admin/AdminBulkImportPage";
import ApplicationsPage from "./pages/applications/ApplicationsPage";
import ForgotPasswordPage from './pages/forgetpassword/ForgotPasswordPage'
import ResetPasswordPage  from './pages/forgetpassword/ResetPasswordPage'

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 px-4">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route
            path="jobs/applied"
            element={<MyJobsPage variant="applied" />}
          />
          <Route path="jobs/saved" element={<MyJobsPage variant="saved" />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="careers" element={<CareersPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Admin dashboard — separate guarded layout, distinct from the
    main app's <ProtectedRoute><AppLayout /></ProtectedRoute> tree */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="jobs" element={<AdminJobsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="jobs/new" element={<AdminJobFormPage />} />
        <Route path="jobs/:id/edit" element={<AdminJobFormPage />} />
        <Route path="jobs/bulk-import" element={<AdminBulkImportPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
