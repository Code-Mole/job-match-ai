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
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/applied" element={<MyJobsPage variant="applied" />} />
          <Route path="jobs/saved" element={<MyJobsPage variant="saved" />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="careers" element={<CareersPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
