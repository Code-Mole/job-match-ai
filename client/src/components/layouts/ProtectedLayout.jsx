import { Outlet, useLocation } from "react-router-dom";
import AppLayout from "./AppLayout";

/** Persists sidebar/header across navigations — prevents full-page reload feel. */
export default function ProtectedLayout() {
  const { pathname } = useLocation();
  const showFooter = pathname !== "/assistant";

  return (
    <AppLayout showFooter={showFooter}>
      <Outlet />
    </AppLayout>
  );
}
