"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ShieldAlert, Download, Loader2, ChevronDown } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function AuditPage() {
  const t = useTranslations("Pages.audit");
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userFilter, setUserFilter] = useState<string>("All");
  const [dateSort, setDateSort] = useState<string>("Newest");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const response = await fetchApi<any[]>("/admin/audits");
        setLogs(response || []);
      } catch (error) {
        console.error("Failed to load audit logs", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);

  const columns = [
    { 
      header: t("colDate"), 
      accessor: (row: any) => new Date(row.timestamp).toLocaleString(), 
      className: "font-mono text-sm whitespace-nowrap" 
    },
    { 
      header: t("colUser"), 
      accessor: (row: any) => row.username || row.user_id, 
      className: "font-medium" 
    },
    { header: t("colAction"), accessor: "action" as const },
    { 
      header: t("colResource"), 
      accessor: (row: any) => `${row.resource_type} (${row.resource_id})`,
      className: "text-text-muted" 
    },
    { 
      header: t("colDetails"), 
      accessor: (row: any) => JSON.stringify(row.details || {}),
      className: "text-text-muted truncate max-w-xs" 
    },
  ];

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description={t("description")} 
        action={
          <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border hover:bg-surface-hover text-white rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            {t("exportLogs")}
          </button>
        }
      />

      <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg p-4 mb-6 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-status-warning mb-1">{t("immutableTitle")}</h4>
          <p className="text-xs text-text-muted">{t("immutableDesc")}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Filter by User:</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsUserDropdownOpen(false);
            }}
          >
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[150px]"
            >
              <span className="truncate pr-2">{userFilter === "All" ? "All Users" : userFilter}</span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${userFilter === "All" ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                  onClick={() => { setUserFilter("All"); setIsUserDropdownOpen(false); }}
                >
                  All Users
                </button>
                {Array.from(new Set(logs.map(l => l.username || l.user_id))).filter(Boolean).map(u => (
                  <button
                    key={String(u)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${userFilter === String(u) ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => { setUserFilter(String(u)); setIsUserDropdownOpen(false); }}
                  >
                    {String(u)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Sort by Date:</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDateDropdownOpen(false);
            }}
          >
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[150px]"
            >
              <span className="truncate pr-2">{dateSort === "Newest" ? "Newest First" : "Oldest First"}</span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDateDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {["Newest", "Oldest"].map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${dateSort === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => { setDateSort(opt); setIsDateDropdownOpen(false); }}
                  >
                    {opt === "Newest" ? "Newest First" : "Oldest First"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={logs
            .filter(l => userFilter === "All" ? true : (l.username || l.user_id) === userFilter)
            .sort((a, b) => {
              const dateA = new Date(a.timestamp).getTime();
              const dateB = new Date(b.timestamp).getTime();
              return dateSort === "Newest" ? dateB - dateA : dateA - dateB;
            })} 
          keyField="id" 
        />
      )}
    </div>
  );
}
