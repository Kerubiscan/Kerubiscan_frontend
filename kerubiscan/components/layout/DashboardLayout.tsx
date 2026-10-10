"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "@/i18n/routing";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The sidebar stays folded: the menu button opens it over the page, and it folds again by
  // itself once a page is chosen (or on a click outside it, or Escape)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-base text-text-main overflow-hidden">
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar />
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen((open) => !open)} menuOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
