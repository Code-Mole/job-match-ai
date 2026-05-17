import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (!token) {
      navigate("/login?error=Missing%20authentication%20token", { replace: true });
      return;
    }

    localStorage.setItem("token", token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;

    axios
      .get("/api/auth/me")
      .then(() => navigate("/", { replace: true }))
      .catch(() => {
        localStorage.removeItem("token");
        delete axios.defaults.headers.common.Authorization;
        navigate("/login?error=Sign-in%20failed", { replace: true });
      });
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Completing sign-in…</p>
    </div>
  );
}
