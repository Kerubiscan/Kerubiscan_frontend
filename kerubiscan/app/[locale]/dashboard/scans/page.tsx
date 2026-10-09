"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DatePicker } from "@/components/ui/DatePicker";
import { Play, Pause, Square, ChevronDown, Edit, Trash2, RotateCw, Eye, Layers } from "lucide-react";
import { NewScanModal } from "@/components/scans/NewScanModal";
import { EditScanModal } from "@/components/scans/EditScanModal";
import { ViewScanModal } from "@/components/scans/ViewScanModal";
import { useSession } from "next-auth/react";
import { canModify } from "@/lib/roles";
import { fetchApi } from "@/lib/api";

interface Company {
  id: string;
  name: string;
}

interface Scan {
  id: string;
  company_id: string;
  name: string;
  target: string;
  scan_type: string;
  status: string;
  progress: number;
  network_zone: string | null;
  scanner_engine: string;
  created_at?: string;
  started_at?: string | null;
  finished_at?: string | null;
  duration_seconds?: number | null;
}

const ACTIVE_STATUSES = ["PENDING", "IN_PROGRESS", "PAUSED"];

/** "45 s", "19 min 04 s", "2 h 05 min" */
function formatDuration(seconds?: number | null): string {
  if (seconds === null || seconds === undefined || seconds < 0) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")} min`;
  if (m > 0) return `${m} min ${String(s).padStart(2, "0")} s`;
  return `${s} s`;
}

export default function ScansPage() {
  const t = useTranslations("Pages.scans");
  const { data: session } = useSession();

  const [scans, setScans] = useState<Scan[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      const data = await fetchApi<Company[]>("/scans/companies");
      setCompanies(data);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    }
  };

  const fetchScans = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = selectedCompany ? `/scans?company_id=${selectedCompany}` : "/scans";
      if (selectedZone) {
        url += url.includes('?') ? `&network_zone=${selectedZone}` : `?network_zone=${selectedZone}`;
      }
      const data = await fetchApi<Scan[]>(url);
      setScans(data);
    } catch (err) {
      console.error("Failed to fetch scans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchScans();
  }, [selectedCompany, selectedZone]);

  // Refresh the percentage and elapsed time while a scan is running
  const hasActiveScan = scans.some((s) => s.status === "IN_PROGRESS" || s.status === "PENDING");
  useEffect(() => {
    if (!hasActiveScan) return;
    const timer = setInterval(() => fetchScans(true), 10000);
    return () => clearInterval(timer);
  }, [hasActiveScan, selectedCompany, selectedZone]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this scan?")) {
      try {
        await fetchApi(`/scans/${id}`, { method: "DELETE" });
        fetchScans();
      } catch (err) {
        console.error("Failed to delete scan", err);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (confirm("Are you absolutely sure you want to delete ALL scans? This cannot be undone.")) {
      try {
        await fetchApi(`/scans`, { method: "DELETE" });
        fetchScans();
      } catch (err: any) {
        alert(err.message || "Failed to delete all scans.");
      }
    }
  };

  const handleDeleteCompany = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete company '${name}'? This cannot be undone.`)) {
      try {
        await fetchApi(`/scans/companies/${id}`, { method: "DELETE" });
        if (selectedCompany === id) setSelectedCompany("");
        fetchCompanies();
      } catch (err: any) {
        alert(err.message || "Failed to delete company.");
      }
    }
  };

  const handleRerun = async (scan: Scan) => {
    try {
      const company = companies.find(c => c.id === scan.company_id);
      await fetchApi("/scans", {
        method: "POST",
        body: JSON.stringify({
          company_name: company ? company.name : "Unknown",
          scan_type: scan.scan_type,
          target: scan.target,
          network_zone: scan.network_zone,
          scanner_engine: scan.scanner_engine,
          scheduled_for: null,
          recurrence_rule: null,
        }),
      });
      fetchScans();
    } catch (err) {
      console.error("Failed to rerun scan", err);
    }
  };


  const handlePause = async (id: string) => {
    try {
      await fetchApi(`/scans/${id}/pause`, { method: "PUT" });
      fetchScans();
    } catch (err: any) {
      alert(err.message || "Failed to pause scan.");
    }
  };

  const handleStop = async (id: string) => {
    if (!confirm(t("stopConfirm"))) return;
    try {
      await fetchApi(`/scans/${id}/stop`, { method: "PUT" });
      fetchScans();
    } catch (err: any) {
      alert(err.message || "Failed to stop scan.");
    }
  };

  const handleResume = async (id: string) => {
    try {
      await fetchApi(`/scans/${id}/resume`, { method: "PUT" });
      fetchScans();
    } catch (err: any) {
      alert(err.message || "Failed to resume scan.");
    }
  };

  const columns = [
    {
      header: t("nameCol"),
      accessor: (row: any) => {
        const isMulti = row.target && row.target.includes(",");
        return (
          <div className="flex items-center gap-2">
            {isMulti && <div className="bg-primary/20 text-primary p-1 rounded" title="Multi-Target Task"><Layers className="w-3.5 h-3.5" /></div>}
            <span className="font-medium">{isMulti ? "Multi-Target Batch" : row.name}</span>
          </div>
        );
      }
    },
    {
      header: t("targetCol"),
      accessor: (row: any) => {
        if (row.target && row.target.includes(",")) {
          const count = row.target.split(",").length;
          return (
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                {count} IPs
              </span>
              <span className="text-xs text-text-muted truncate max-w-[120px]" title={row.target}>
                {row.target}
              </span>
            </div>
          );
        }
        return row.target;
      }
    },
    { header: t("typeCol"), accessor: "scan_type" as const },
    {
      header: t("dateTimeCol"),
      accessor: (row: any) => {
        if (!row.created_at) return "-";
        return new Date(row.created_at).toLocaleString();
      }
    },
    {
      header: t("statusCol"),
      accessor: (row: any) => {
        let variant = "info";
        if (row.status === "COMPLETED") variant = "success";
        if (row.status === "PAUSED") variant = "neutral";
        if (row.status === "FAILED") variant = "critical";
        if (row.status === "IN_PROGRESS" || row.status === "PENDING") variant = "warning";

        // Percentage of the scan (100 % once finished, whatever the outcome)
        const isActive = ACTIVE_STATUSES.includes(row.status);
        const progress = isActive ? Math.min(Math.max(row.progress || 0, 0), 100) : 100;

        let statusLabel = row.status;
        if (row.status === "PENDING") statusLabel = t("statusPending");
        if (row.status === "IN_PROGRESS") statusLabel = t("statusInProgress");
        if (row.status === "PAUSED") statusLabel = "Paused";
        if (row.status === "COMPLETED") statusLabel = t("statusCompleted");
        if (row.status === "FAILED") statusLabel = t("statusFailed");

        // Finished (completed, failed or stopped): the status only
        if (!isActive) {
          return <StatusBadge status={variant as any} label={statusLabel} />;
        }

        // Running: one badge that fills up with the percentage
        return (
          <span
            className="relative inline-flex items-center overflow-hidden px-2.5 py-0.5 rounded-full text-xs font-medium border border-status-medium/40 text-status-medium bg-status-medium/10 min-w-[120px]"
            title={`${statusLabel} - ${progress} %`}
          >
            <span
              className="absolute inset-y-0 left-0 bg-status-medium/30 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
            <span className="relative w-full flex items-center justify-between gap-2">
              <span>{statusLabel}</span>
              <span className="tabular-nums font-semibold">{progress} %</span>
            </span>
          </span>
        );
      }
    },
    {
      header: t("endCol"),
      accessor: (row: any) => {
        if (row.finished_at) {
          return (
            <div className="flex flex-col">
              <span>{new Date(row.finished_at).toLocaleString()}</span>
              <span className="text-xs text-text-muted">{formatDuration(row.duration_seconds)}</span>
            </div>
          );
        }
        if (row.status === "IN_PROGRESS" && row.duration_seconds !== null && row.duration_seconds !== undefined) {
          return <span className="text-xs text-text-muted">{formatDuration(row.duration_seconds)} {t("elapsed")}</span>;
        }
        return "-";
      }
    },
    {
      header: t("actions") || "Actions",
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => { setSelectedScan(row); setIsViewModalOpen(true); }} className="p-1 text-text-muted hover:text-white transition-colors" title={t("view") || "View Details"}>
            <Eye className="w-4 h-4" />
          </button>
          {canModify(session as any) && (
            <>
              
              {row.status === "IN_PROGRESS" || row.status === "PENDING" ? (
                <button onClick={() => handlePause(row.id)} className="p-1 text-text-muted hover:text-status-warning transition-colors" title="Pause Scan">
                  <Pause className="w-4 h-4" />
                </button>
              ) : null}
              {ACTIVE_STATUSES.includes(row.status) ? (
                <button onClick={() => handleStop(row.id)} className="p-1 text-text-muted hover:text-status-critical transition-colors" title={t("stop")}>
                  <Square className="w-4 h-4" />
                </button>
              ) : null}
              {row.status === "PAUSED" ? (
                <button onClick={() => handleResume(row.id)} className="p-1 text-text-muted hover:text-status-success transition-colors" title="Resume Scan">
                  <Play className="w-4 h-4" />
                </button>
              ) : null}
              <button onClick={() => { setSelectedScan(row); setIsEditModalOpen(true); }} className="p-1 text-text-muted hover:text-white transition-colors" title={t("edit") || "Edit"}>
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleRerun(row)} className="p-1 text-text-muted hover:text-primary transition-colors" title={t("rerun") || "Rerun"}>
                <RotateCw className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(row.id)} className="p-1 text-text-muted hover:text-status-critical transition-colors" title={t("delete") || "Delete"}>
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="pb-6 relative">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          canModify(session as any) ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-4 py-2 bg-status-critical/10 hover:bg-status-critical/20 text-status-critical border border-status-critical/30 rounded-lg text-sm font-medium transition-colors"
                title="Delete All Scans"
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" fill="currentColor" />
                {t("newScan")}
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("companyLabel")}</label>
          <div
            className="relative"
            tabIndex={0}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[200px] w-[200px]"
            >
              <span className="truncate pr-2">
                {selectedCompany === "" ? t("allCompanies") : companies.find(c => c.id.toString() === selectedCompany)?.name || t("allCompanies")}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${selectedCompany === "" ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                  onClick={() => {
                    setSelectedCompany("");
                    setIsDropdownOpen(false);
                  }}
                >
                  {t("allCompanies")}
                </button>
                {companies.map(c => (
                  <div key={c.id} className="relative flex items-center w-full group">
                    <button
                      className={`w-full text-left px-3 py-2 pr-8 text-sm hover:bg-base transition-colors truncate ${selectedCompany === c.id.toString() ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                      onClick={() => {
                        setSelectedCompany(c.id.toString());
                        setIsDropdownOpen(false);
                      }}
                    >
                      {c.name}
                    </button>
                    <button
                      onClick={(e) => handleDeleteCompany(c.id.toString(), c.name, e)}
                      className="absolute right-2 p-1 text-text-muted hover:text-status-critical opacity-50 group-hover:opacity-100 transition-all"
                      title="Delete Company"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("statusLabel")}</label>
          <div
            className="relative"
            tabIndex={0}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsStatusDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px] w-[160px]"
            >
              <span className="truncate pr-2">
                {selectedStatus === "" ? t("allStatuses") :
                  (selectedStatus === "PENDING" ? t("statusPending") :
                    (selectedStatus === "IN_PROGRESS" ? t("statusInProgress") :
                      (selectedStatus === "COMPLETED" ? t("statusCompleted") : t("statusFailed"))))}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {[
                  { value: "", label: t("allStatuses") },
                  { value: "PENDING", label: t("statusPending") },
                  { value: "IN_PROGRESS", label: t("statusInProgress") },
                  { value: "COMPLETED", label: t("statusCompleted") },
                  { value: "FAILED", label: t("statusFailed") },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${selectedStatus === opt.value ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setSelectedStatus(opt.value);
                      setIsStatusDropdownOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("typeLabel")}</label>
          <div
            className="relative"
            tabIndex={0}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsTypeDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px] w-[160px]"
            >
              <span className="truncate pr-2">
                {selectedType === "" ? t("allTypes") : (selectedType === "DISCOVERY" ? t("typeDiscovery") : t("typeVulnerability"))}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {[
                  { value: "", label: t("allTypes") },
                  { value: "DISCOVERY", label: t("typeDiscovery") },
                  { value: "VULNERABILITY", label: t("typeVulnerability") },
                  { value: "WEB_APP", label: "Application Scan" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${selectedType === opt.value ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setSelectedType(opt.value);
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("networkZoneLabel")}</label>
          <div
            className="relative"
            tabIndex={0}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsZoneDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px] w-[160px]"
            >
              <span className="truncate pr-2">
                {selectedZone === "" ? t("allZones") : selectedZone}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isZoneDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isZoneDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {[
                  { value: "", label: t("allZones") },
                  ...Array.from(new Set(["DMZ", "Internal", "Cloud", "Gateway", ...scans.map(s => s.network_zone).filter(Boolean)])).map(z => ({ value: z as string, label: z as string }))
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${selectedZone === opt.value ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setSelectedZone(opt.value);
                      setIsZoneDropdownOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("dateLabel")}</label>
          <DatePicker
            value={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            placeholder="Select date"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={scans.filter(scan =>
          (selectedStatus === "" || scan.status === selectedStatus) &&
          (selectedType === "" || scan.scan_type === selectedType) &&
          (selectedDate === "" || (scan.created_at && new Date(scan.created_at).toISOString().split('T')[0] === selectedDate))
        )}
        keyField="id"
      />

      <NewScanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchCompanies();
          fetchScans();
        }}
      />
      <EditScanModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedScan(null); }}
        onSuccess={() => fetchScans()}
        scan={selectedScan}
      />
      <ViewScanModal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setSelectedScan(null); }}
        scan={selectedScan}
        companies={companies}
      />
    </div>
  );
}
