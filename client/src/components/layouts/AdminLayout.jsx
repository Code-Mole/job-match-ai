import { Outlet } from "react-router-dom";
import AdminSidebar from "../admin/AdminSidebar";
import AdminMobileNav from "../admin/AdminMobileNav";

/**
 * Shell for every /admin/* page. Renders the violet-accented sidebar
 * (desktop, ≥1024px) or the compact top bar + drawer (mobile/tablet),
 * with the routed page content in <Outlet />.
 *
 * Deliberately does NOT reuse the main app's <AppLayout /> — NFR-A2
 * requires this context to be visually distinct, not just a themed
 * variant of the same shell.
 */
export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminMobileNav />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
