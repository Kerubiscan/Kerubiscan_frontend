"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DatePicker } from "@/components/ui/DatePicker";
import { Play, ChevronDown, Edit, Trash2, RotateCw, Eye } from "lucide-react";
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

  const fetchScans = async () => {
    setLoading(true);
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

  const columns = [
    { header: t("nameCol"), accessor: "name" as const, className: "font-medium" },
    { header: t("targetCol"), accessor: "target" as const },
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
        if (row.status === "FAILED") variant = "critical";
        if (row.status === "IN_PROGRESS" || row.status === "PENDING") variant = "warning";
        
        const isProgress = row.status === "IN_PROGRESS";
        const progress = row.progress || 0;

        let statusLabel = row.status;
        if (row.status === "PENDING") statusLabel = t("statusPending");
        if (row.status === "IN_PROGRESS") statusLabel = t("statusInProgress");
        if (row.status === "COMPLETED") statusLabel = t("statusCompleted");
        if (row.status === "FAILED") statusLabel = t("statusFailed");

        return (
          <div className="flex items-center gap-3">
            <StatusBadge status={variant as any} label={statusLabel} />
          </div>
        );
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4" fill="currentColor" />
              {t("newScan")}
            </button>
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
                  <button
                    key={c.id}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors truncate ${selectedCompany === c.id.toString() ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setSelectedCompany(c.id.toString());
                      setIsDropdownOpen(false);
                    }}
                  >
                    {c.name}
                  </button>
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
      />
    </div>
  );
}
