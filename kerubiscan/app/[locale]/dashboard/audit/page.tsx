"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ShieldAlert, Download, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function AuditPage() {
  const t = useTranslations("Pages.audit");
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      header: "Timestamp", 
      accessor: (row: any) => new Date(row.timestamp).toLocaleString(), 
      className: "font-mono text-sm whitespace-nowrap" 
    },
    { 
      header: "User", 
      accessor: (row: any) => row.username || row.user_id, 
      className: "font-medium" 
    },
    { header: "Action", accessor: "action" as const },
    { 
      header: "Resource", 
      accessor: (row: any) => `${row.resource_type} (${row.resource_id})`,
      className: "text-text-muted" 
    },
    { 
      header: "Details", 
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
            Export Logs
          </button>
        }
      />

      <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg p-4 mb-6 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-status-warning mb-1">Immutable Audit Trail</h4>
          <p className="text-xs text-text-muted">These logs are read-only and cryptographically signed. They cannot be modified or deleted by system administrators.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={logs} 
          keyField="id" 
        />
      )}
    </div>
  );
}
