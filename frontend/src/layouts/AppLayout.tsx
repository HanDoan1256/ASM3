import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

