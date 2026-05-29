import { useState } from "react";
import Sidebar from "./SideBar";
import Header from "./Header";
import Footer from "./Footer";

// children = the page content (Dashboard, Jobs, etc.)
// onSearch is optional — passes search query up to the page
// showFooter=false hides footer (e.g. AI Assistant full-height chat)
export default function AppLayout({ children, onSearch, showFooter = true }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />

      {/* Right side: header + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onSearch={onSearch}
          onOpenMenu={() => setMobileNavOpen(true)}
        />

        {/* Page content scrolls independently of sidebar */}
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">{children}</div>
          {showFooter && <Footer />}
        </main>
      </div>
    </div>
  );
}
