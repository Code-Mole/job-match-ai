import Sidebar from "./SideBar";
import Header from "./Header";

// children = the page content (Dashboard, Jobs, etc.)
// onSearch is optional — passes search query up to the page
export default function AppLayout({ children, onSearch }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar />

      {/* Right side: header + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onSearch={onSearch} />

        {/* Page content scrolls independently of sidebar */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
