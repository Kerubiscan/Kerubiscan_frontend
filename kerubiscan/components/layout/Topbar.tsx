"use client";

import React, { useState, useEffect } from "react";
import { Menu, HelpCircle, Bell, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { Link, usePathname } from "@/i18n/routing";
import { fetchApi } from "@/lib/api";
import { signOut } from "next-auth/react";

export function Topbar() {
  const t = useTranslations("Topbar");
  const tNav = useTranslations("Navigation");
  const pathname = usePathname();

  const [username, setUsername] = useState<string>(t("admin"));
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);

  // Determine current page title based on pathname
  let pageTitle = tNav("dashboard");
  if (pathname.includes("/dashboard/scans")) pageTitle = tNav("scans");
  else if (pathname.includes("/dashboard/assets")) pageTitle = tNav("assets");
  else if (pathname.includes("/dashboard/vulnerabilities")) pageTitle = tNav("vulnerabilities");
  else if (pathname.includes("/dashboard/reports")) pageTitle = tNav("reports");
  else if (pathname.includes("/dashboard/scheduling")) pageTitle = tNav("scheduling");
  else if (pathname.includes("/dashboard/policies")) pageTitle = tNav("policies");
  else if (pathname.includes("/dashboard/users")) pageTitle = tNav("users");
  else if (pathname.includes("/dashboard/settings")) pageTitle = tNav("settings");
  else if (pathname.includes("/dashboard/audit")) pageTitle = tNav("audit");

  useEffect(() => {
    async function loadTopbarData() {
      try {
        const [authData, notifData] = await Promise.all([
          fetchApi<any>("/auth/me").catch(() => null),
          fetchApi<any>("/notifications/unread-count").catch(() => null)
        ]);
        
        if (authData && authData.user && authData.user.preferred_username) {
          setUsername(authData.user.preferred_username);
        }
        
        if (notifData && typeof notifData.unread_count === "number") {
          setUnreadCount(notifData.unread_count);
        }
      } catch (err) {
        console.error("Failed to fetch topbar data", err);
      }
    }
    loadTopbarData();
  }, [t]);

  const handleHelpClick = () => {
    alert("KerubiScan v1.0\n\nBesoin d'aide ?\nVeuillez consulter la documentation interne ou contacter votre administrateur système pour plus de détails sur le fonctionnement du scanner de vulnérabilités.");
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/federated-logout");
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Clear local next-auth session first without redirecting
          await signOut({ redirect: false });
          // Redirect to Keycloak to clear the SSO session
          window.location.href = data.url;
          return;
        }
      }
    } catch (error) {
      console.error("Federated logout failed", error);
    }
    // Fallback if federated logout fails
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="h-20 bg-base border-b border-border flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-4">
        <button className="text-text-muted hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <LanguageSwitcher />


        <div className="relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setTimeout(() => setIsUserMenuOpen(false), 200);
              }
            }}
            className="flex items-center gap-3 pl-4 border-l border-border hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center border border-border">
              <User className="w-4 h-4 text-text-muted" />
            </div>
            <span className="text-sm font-medium">{username}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-text-muted transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-3 border-b border-border/50 bg-base/50">
                <p className="text-sm font-medium text-white truncate">{username}</p>
                <p className="text-xs text-text-muted truncate">Administrator</p>
              </div>
              <div className="py-1">
              </div>
              <div className="py-1 border-t border-border/50">
                <button 
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSignOut();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-status-critical hover:bg-status-critical/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
