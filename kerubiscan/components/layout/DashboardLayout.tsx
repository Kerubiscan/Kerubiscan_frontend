"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "@/i18n/routing";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

// Wide screens (Tailwind "lg"): the sidebar pushes the page; below, it slides over it
const DESKTOP_QUERY = "(min-width: 1024px)";
// Per-browser convenience: the sidebar stays as the user left it on wide screens
const STORAGE_KEY = "kvs.sidebarOpen";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The menu button opens the sidebar; a second click folds it back to the left.
  // Wide screens: it takes its place beside the page, which moves to the right.
  // Small screens (no room to push): it slides over the page and closes after a choice,
  // a click outside it or Escape.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(query.matches);
    update();
    try {
      if (query.matches && window.localStorage.getItem(STORAGE_KEY) === "1") setSidebarOpen(true);
    } catch {
      // storage unavailable (private window, blocked site data): the sidebar starts folded
    }
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Small screens: close the drawer once a page is chosen
  useEffect(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen || isDesktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, isDesktop]);

  const toggleSidebar = () => {
    setSidebarOpen((open) => {
      const next = !open;
      if (isDesktop) {
        try {
          window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
        } catch {
          // not remembered: no harm
        }
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-base text-text-main overflow-hidden">
      {/* One sidebar for both layouts: fixed drawer on small screens, column of the page on wide
          ones (its width goes from 0 to 16rem, so the dashboard slides right or back left) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 lg:static lg:z-auto shrink-0 overflow-hidden transition-all duration-300 ease-out ${
          sidebarOpen
            ? "translate-x-0 shadow-2xl lg:shadow-none lg:w-64"
            : "-translate-x-full lg:translate-x-0 lg:w-0"
        }`}
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
      >
        <Sidebar />
      </div>
      {sidebarOpen && !isDesktop && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuClick={toggleSidebar} menuOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
