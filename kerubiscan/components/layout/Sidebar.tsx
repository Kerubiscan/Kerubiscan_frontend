"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";
import { 
  Home, 
  Clock, 
  Monitor, 
  ShieldAlert, 
  FileText, 
  Calendar, 
  FileCheck, 
  Users, 
  Settings, 
  Activity,
  Key
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import { canViewAuditsAndUsers } from "@/lib/roles";

import { fetchApi } from "@/lib/api";

export function Sidebar() {
  const t = useTranslations("Navigation");
  const tScanner = useTranslations("Scanner");
  const pathname = usePathname();
  const { data: session } = useSession();

  const [scannerStatus, setScannerStatus] = React.useState({
    status: tScanner("operational") || "Opérationnel",
    scans_in_progress: 0,
    scheduled_scans: 0,
    last_scan_time: "-"
  });

  React.useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await fetchApi<any>("/scans/status");
        if (data) {
          setScannerStatus({
            status: data.status || tScanner("operational"),
            scans_in_progress: data.scans_in_progress || 0,
            scheduled_scans: data.scheduled_scans || 0,
            last_scan_time: data.last_scan_time || "-"
          });
        }
      } catch (err) {
        console.error("Failed to fetch scanner status", err);
      }
    }
    fetchStatus();
  }, []);

  const menuItems = [
    { icon: Home, label: t("dashboard"), href: "/dashboard", restricted: false },
    { icon: Clock, label: t("scans"), href: "/dashboard/scans", restricted: false },
    { icon: Monitor, label: t("assets"), href: "/dashboard/assets", restricted: false },
    { icon: ShieldAlert, label: t("vulnerabilities"), href: "/dashboard/vulnerabilities", restricted: false },
    { icon: FileText, label: t("reports"), href: "/dashboard/reports", restricted: false },
    { icon: Calendar, label: t("scheduling"), href: "/dashboard/scheduling", restricted: false },
    { icon: FileCheck, label: t("policies"), href: "/dashboard/policies", restricted: false },
    { icon: Key, label: t("secrets") || "Secrets", href: "/dashboard/secrets", restricted: false },
    { icon: Users, label: t("users"), href: "/admin/users", restricted: true },
    { icon: Settings, label: t("settings"), href: "/dashboard/settings", restricted: false },
    { icon: Activity, label: t("audit"), href: "/dashboard/audit", restricted: true },
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (item.restricted) {
      return canViewAuditsAndUsers(session as any);
    }
    return true;
  });

  return (
    <div className="w-64 h-full bg-base border-r border-border flex flex-col shrink-0">
      <div className="h-20 px-6 flex items-center border-b border-border/50 shrink-0">
        <Logo className="scale-90 origin-left" />
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-hide">
        {visibleMenuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link 
              href={item.href as any} 
              key={index}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                isActive 
                  ? "bg-primary text-white font-medium" 
                  : "text-text-muted hover:text-white hover:bg-surface"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="px-4 pb-6 mt-auto">
        <div className="p-5 border border-border rounded-xl bg-surface/20">
          <h4 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">{tScanner("statusTitle")}</h4>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-status-info shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <span className="text-status-info text-sm font-medium">{scannerStatus.status}</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-text-muted">{tScanner("scansInProgress")}</span>
              <span className="font-semibold text-white">{scannerStatus.scans_in_progress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted">{tScanner("scheduledScans")}</span>
              <span className="font-semibold text-white">{scannerStatus.scheduled_scans}</span>
            </div>
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-border/50">
              <span className="text-text-muted text-xs">{tScanner("lastScan")}</span>
              <span className="text-white text-xs">{scannerStatus.last_scan_time}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
