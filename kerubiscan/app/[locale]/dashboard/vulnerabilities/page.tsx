"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChevronDown, Eye, X, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function VulnerabilitiesPage() {
  const t = useTranslations("Pages.vulnerabilities");
  
  const [severityFilter, setSeverityFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isSeverityDropdownOpen, setIsSeverityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);

  const [vulnsData, setVulnsData] = useState<any[]>([]);
  const [assetsData, setAssetsData] = useState<any[]>([]);
  const [companiesData, setCompaniesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [openRowId, setOpenRowId] = useState<number | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVuln, setSelectedVuln] = useState<any>(null);
  
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [vulnsRes, assetsRes, companiesRes] = await Promise.all([
        fetchApi<any>("/vulnerabilities?size=500"),
        fetchApi<any>("/assets?size=500"),
        fetchApi<any[]>("/scans/companies")
      ]);
      setVulnsData(vulnsRes.items || []);
      setAssetsData(assetsRes.items || []);
      setCompaniesData(companiesRes || []);
    } catch (err) {
      console.error("Failed to fetch vulnerabilities data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await fetchApi(`/vulnerabilities/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      // Optimistic update
      setVulnsData(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update vulnerability status.");
    }
    setOpenRowId(null);
  };

  const enrichVuln = (vuln: any) => {
    const asset = assetsData.find(a => a.id === vuln.asset_id);
    const companyName = asset?.company_id 
      ? companiesData.find(c => c.id === asset.company_id)?.name || "-" 
      : "-";
    
    return {
      ...vuln,
      cve: vuln.cve_id || "-",
      name: vuln.title,
      target: asset ? `${asset.name} (${asset.ip_address})` : `Asset ID: ${vuln.asset_id}`,
      company: companyName,
      score: vuln.cvss_base_score || "-",
      network_zone: asset?.network_zone || "-"
    };
  };

  const columns = [
    { 
      header: "Severity", 
      accessor: (row: any) => {
        const enriched = enrichVuln(row);
        return <StatusBadge status={enriched.severity.toLowerCase() as any} label={enriched.severity} />;
      }
    },
    { 
      header: "CVE ID", 
      accessor: (row: any) => enrichVuln(row).cve, 
      className: "text-text-muted" 
    },
    { 
      header: "Vulnerability Name", 
      accessor: (row: any) => enrichVuln(row).name, 
      className: "font-medium max-w-[300px] truncate" 
    },
    { 
      header: "Target Asset", 
      accessor: (row: any) => enrichVuln(row).target 
    },
    { 
      header: "Company", 
      accessor: (row: any) => enrichVuln(row).company, 
      className: "text-text-muted" 
    },
    { 
      header: "CVSS Score", 
      accessor: (row: any) => enrichVuln(row).score, 
      className: "font-mono" 
    },
    {
      header: "Status",
      accessor: (row: any) => {
        const enriched = enrichVuln(row);
        let variant = "info";
        if (enriched.status === "New") variant = "critical";
        if (enriched.status === "In Progress") variant = "warning";
        if (enriched.status === "Fixed") variant = "success";
        if (enriched.status === "Risk Accepted") variant = "info";

        return (
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setOpenRowId(openRowId === row.id ? null : row.id); }}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <StatusBadge status={variant as any} label={enriched.status} />
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>
            {openRowId === row.id && (
              <div className="absolute z-20 top-full right-0 mt-1 w-36 bg-surface border border-border rounded-lg shadow-xl overflow-hidden py-1 animate-in fade-in">
                {["New", "In Progress", "Risk Accepted", "Fixed", "False Positive"].map(s => (
                  <button 
                    key={s} 
                    onClick={() => updateStatus(row.id, s)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-base transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <button 
          onClick={async (e) => { 
            e.stopPropagation(); 
            const enriched = enrichVuln(row);
            setSelectedVuln(enriched); 
            setIsViewModalOpen(true); 
            
            // Fetch history
            setHistoryLoading(true);
            try {
              const res = await fetchApi<any[]>(`/vulnerabilities/${row.id}/history`);
              setHistoryData(res || []);
            } catch (err) {
              console.error("Failed to load history", err);
              setHistoryData([]);
            } finally {
              setHistoryLoading(false);
            }
          }}
          className="p-1 text-text-muted hover:text-primary transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  const filteredData = useMemo(() => {
    return vulnsData.filter(item => {
      const enriched = enrichVuln(item);
      const matchSeverity = severityFilter === "All" || enriched.severity === severityFilter;
      const matchCompany = companyFilter === "All" || enriched.company === companyFilter;
      const matchStatus = statusFilter === "All" || enriched.status === statusFilter;
      const matchZone = zoneFilter === "All" || enriched.network_zone === zoneFilter;
      return matchSeverity && matchCompany && matchStatus && matchZone;
    });
  }, [severityFilter, companyFilter, statusFilter, zoneFilter, vulnsData, assetsData, companiesData]);

  const companiesList = ["All", ...companiesData.map(c => c.name)];
  const severities = ["All", "Critical", "High", "Medium", "Low", "Info"];
  const statuses = ["All", "New", "In Progress", "Risk Accepted", "Fixed", "False Positive"];
  const zones = ["All", "DMZ", "Internal", "Cloud", "Gateway"];

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description={t("description")} 
      />
      
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Company:</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsCompanyDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[200px] w-[200px]"
            >
              <span className="truncate pr-2">
                {companyFilter === "All" ? "All Companies" : companyFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCompanyDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {companiesList.map(c => (
                  <button
                    key={c}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors truncate ${companyFilter === c ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setCompanyFilter(c);
                      setIsCompanyDropdownOpen(false);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Severity:</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsSeverityDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsSeverityDropdownOpen(!isSeverityDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px] w-[160px]"
            >
              <span className="truncate pr-2">
                {severityFilter === "All" ? "All Severities" : severityFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isSeverityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSeverityDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {severities.map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${severityFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setSeverityFilter(opt);
                      setIsSeverityDropdownOpen(false);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Status:</label>
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
                {statusFilter === "All" ? "All Statuses" : statusFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {statuses.map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${statusFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setStatusFilter(opt);
                      setIsStatusDropdownOpen(false);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Network Zone:</label>
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
                {zoneFilter === "All" ? "All Zones" : zoneFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isZoneDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isZoneDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {zones.map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${zoneFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setZoneFilter(opt);
                      setIsZoneDropdownOpen(false);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div onClick={() => setOpenRowId(null)}>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredData} 
            keyField="id" 
          />
        )}
      </div>

      {/* View Vulnerability Details Modal */}
      {isViewModalOpen && selectedVuln && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsViewModalOpen(false)}>
          <div className="bg-surface h-full w-full max-w-lg shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-base/50">
              <h3 className="font-semibold text-xl">Vulnerability Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-text-muted hover:text-white transition-colors bg-surface p-1.5 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex items-center gap-3">
                 <StatusBadge status={selectedVuln.severity.toLowerCase() as any} label={selectedVuln.severity} />
                 <span className="text-sm font-medium text-text-muted">{selectedVuln.cve}</span>
                 <span className="text-sm font-mono ml-auto">CVSS: {selectedVuln.score}</span>
              </div>
              
              <h4 className="text-2xl font-bold">{selectedVuln.name}</h4>
              
              <div className="bg-base p-4 rounded-lg border border-border/50 space-y-2">
                <p className="text-sm text-text-muted">Target Asset</p>
                <p className="font-medium">{selectedVuln.target}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <p className="text-xs text-text-muted">Network Zone: <span className="font-medium text-text-main">{selectedVuln.network_zone}</span></p>
                  <p className="text-xs text-text-muted">Company: <span className="font-medium text-text-main">{selectedVuln.company}</span></p>
                  <p className="text-xs text-text-muted">Source Engine: <span className="font-medium text-text-main">{selectedVuln.source_engine || "OPENVAS"}</span></p>
                  <p className="text-xs text-text-muted">AI Contextual Risk: <span className="font-medium text-text-main">{selectedVuln.contextual_risk_score || "N/A"}</span></p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border/50 pb-2">Scanner Description</h4>
                <p className="text-sm text-text-main leading-relaxed">
                  {selectedVuln.description || "No description provided."}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border/50 pb-2">Remediation Recommendation</h4>
                <p className="text-sm text-text-main leading-relaxed">
                  {selectedVuln.remediation || "No remediation provided."}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border/50 pb-2">Timeline</h4>
                <p className="text-xs text-text-main leading-relaxed">
                  <strong>First Detected:</strong> {new Date(selectedVuln.first_detected_at).toLocaleString()}<br/>
                  <strong>Last Seen:</strong> {new Date(selectedVuln.last_seen_at).toLocaleString()}
                </p>
                
                {historyLoading ? (
                  <div className="flex items-center gap-2 text-text-muted text-xs mt-4">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading status history...
                  </div>
                ) : historyData.length > 0 ? (
                  <div className="mt-4 border-l-2 border-border/50 ml-2 pl-4 space-y-4">
                    {historyData.map((record: any, idx: number) => (
                      <div key={record.id} className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-surface"></div>
                        <p className="text-xs font-medium text-text-main">
                          {record.changed_by} <span className="text-text-muted font-normal">changed status from</span> {record.previous_status} <span className="text-text-muted font-normal">to</span> {record.new_status}
                        </p>
                        <p className="text-[10px] text-text-muted mt-0.5">{new Date(record.changed_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted mt-4">No status changes recorded.</p>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-border/50 bg-base/50">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full py-2.5 bg-surface hover:bg-surface-hover border border-border text-white rounded-lg text-sm font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
