import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem("smartfm_access_token"));
  const isStaff = localStorage.getItem("smartfm_principal_type") === "staff";
  const staffOnlyPath = location.pathname === "/fleet" || location.pathname === "/reports";

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }
  if (staffOnlyPath && !isStaff) {
    return <Navigate replace to="/" />;
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[290px_1fr]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="space-y-4">
          <Navbar onMenuToggle={() => setSidebarOpen((current) => !current)} />
          <main className="enterprise-surface min-h-[calc(100vh-7rem)] p-5 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
