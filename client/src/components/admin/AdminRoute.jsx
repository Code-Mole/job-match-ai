import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import  LoadingSkeleton  from "../ui/LoadingSkeleton";

/**
 * Route guard for everything under /admin/*.
 *
 * Mirrors the existing ProtectedRoute pattern used for the main app,
 * but adds a second check on top of "is logged in": role === 'admin'.
 *
 * - Not logged in              → redirect to /login
 * - Logged in, not admin       → redirect to /dashboard (silently —
 *   no error shown, since a non-admin simply shouldn't see this
 *   route exists at all)
 * - Logged in, admin           → render children
 */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSkeleton className="w-10 h-10 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
