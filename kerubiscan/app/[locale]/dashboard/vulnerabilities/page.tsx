"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChevronDown, Eye, X, Loader2, Download } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function VulnerabilitiesPage() {
  const t = useTranslations("Pages.vulnerabilities");

  const openReportEditor = (vuln: any) => {
    const content = `VULNERABILITY REPORT
======================
Title: ${vuln.name}
CVE: ${vuln.cve}
Severity: ${getSeverityTranslation(vuln.severity) || vuln.severity}
CVSS Score: ${vuln.score}
Status: ${getStatusTranslation(vuln.status) || vuln.status}

TARGET INFORMATION
======================
Target Asset: ${vuln.target}
Company: ${vuln.company}
Network Zone: ${vuln.network_zone}
Source Engine: ${vuln.source_engine || "OPENVAS"}

DESCRIPTION
======================
${vuln.description || "No description provided."}

REMEDIATION
======================
${vuln.remediation || "No remediation provided."}

TIMELINE
======================
First Detected: ${new Date(vuln.first_detected_at).toLocaleString()}
Last Seen: ${new Date(vuln.last_seen_at).toLocaleString()}
`;
    setReportContent(content);
    setReportFilename(`Vulnerability_Report_${vuln.cve !== "-" ? vuln.cve : vuln.id}.txt`);
    setIsReportModalOpen(true);
  };

  const handleExport = () => {
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = reportFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsReportModalOpen(false);
  };

  const getSeverityTranslation = (sev: string) => {
    if (!sev) return sev;
    const map: Record<string, string> = {
      "Critical": t("sevCritical"),
      "High": t("sevHigh"),
      "Medium": t("sevMedium"),
      "Low": t("sevLow"),
      "Info": t("sevInfo")
    };
    return map[sev] || sev;
  };

  const getStatusTranslation = (status: string) => {
    if (!status) return status;
    const map: Record<string, string> = {
      "New": t("statusNew"),
      "In Progress": t("statusInProgress"),
      "Risk Accepted": t("statusRiskAccepted"),
      "Fixed": t("statusFixed"),
      "False Positive": t("statusFalsePositive")
    };
    return map[status] || status;
  };

  const getZoneTranslation = (zone: string) => {
    if (!zone) return zone;
    const map: Record<string, string> = {
      "DMZ": t("zoneDMZ"),
      "Internal": t("zoneInternal"),
      "Cloud": t("zoneCloud"),
      "Gateway": t("zoneGateway")
    };
    return map[zone] || zone;
  };
  
  const [severityFilter, setSeverityFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [sortFilter, setSortFilter] = useState("Date (Newest)");
  
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isSeverityDropdownOpen, setIsSeverityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const [vulnsData, setVulnsData] = useState<any[]>([]);
  const [assetsData, setAssetsData] = useState<any[]>([]);
  const [companiesData, setCompaniesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [openRowId, setOpenRowId] = useState<number | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVuln, setSelectedVuln] = useState<any>(null);
  
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState("");
  const [reportFilename, setReportFilename] = useState("");

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

  const updateStatus = async (id: string, newStatus: string) => {
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
      network_zone: asset?.network_zone || "-",
      ip_address: asset?.ip_address,
      last_scan_raw_output: asset?.last_scan_raw_output || null
    };
  };

  const columns = [
    { 
      header: t("severityCol"), 
      accessor: (row: any) => {
        const enriched = enrichVuln(row);
        return <StatusBadge status={enriched.severity.toLowerCase() as any} label={getSeverityTranslation(enriched.severity)} />;
      }
    },
    { 
      header: t("cveIdCol"), 
      accessor: (row: any) => enrichVuln(row).cve, 
      className: "text-text-muted" 
    },
    { 
      header: t("vulnNameCol"), 
      accessor: (row: any) => enrichVuln(row).name, 
      className: "font-medium max-w-[300px] truncate" 
    },
    { 
      header: t("targetAssetCol"), 
      accessor: (row: any) => enrichVuln(row).target 
    },
    { 
      header: t("companyCol"), 
      accessor: (row: any) => enrichVuln(row).company, 
      className: "text-text-muted" 
    },
    { 
      header: t("cvssScoreCol"), 
      accessor: (row: any) => enrichVuln(row).score, 
      className: "font-mono" 
    },
    {
      header: t("statusCol"),
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
              <StatusBadge status={variant as any} label={getStatusTranslation(enriched.status)} />
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
                    {getStatusTranslation(s)}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: t("actionsCol"),
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
    const filtered = vulnsData.filter(item => {
      const enriched = enrichVuln(item);
      const matchSeverity = severityFilter === "All" || enriched.severity === severityFilter;
      const matchCompany = companyFilter === "All" || enriched.company === companyFilter;
      const matchStatus = statusFilter === "All" || enriched.status === statusFilter;
      let matchZone = true;
      if (zoneFilter !== "All") {
        const [filterSubnet, filterZone] = zoneFilter.split('|');
        const prefix = filterSubnet.replace(".0/24", "");
        matchZone = !!enriched.ip_address?.startsWith(prefix) && (enriched.network_zone === filterZone || (!enriched.network_zone && filterZone === "Unassigned"));
      }
      return matchSeverity && matchCompany && matchStatus && matchZone;
    });
    
    // Apply Sorting
    filtered.sort((a, b) => {
      if (sortFilter === "Date (Newest)") {
        return new Date(b.first_detected_at).getTime() - new Date(a.first_detected_at).getTime();
      } else if (sortFilter === "Date (Oldest)") {
        return new Date(a.first_detected_at).getTime() - new Date(b.first_detected_at).getTime();
      } else if (sortFilter === "Severity (Highest)") {
        return (b.cvss_base_score || 0) - (a.cvss_base_score || 0);
      } else if (sortFilter === "Severity (Lowest)") {
        return (a.cvss_base_score || 0) - (b.cvss_base_score || 0);
      }
      return 0;
    });
    
    return filtered;
  }, [severityFilter, companyFilter, statusFilter, zoneFilter, sortFilter, vulnsData, assetsData, companiesData]);

  const companiesList = ["All", ...companiesData.map(c => c.name)];
  const severities = ["All", "Critical", "High", "Medium", "Low", "Info"];
  const statuses = ["All", "New", "In Progress", "Risk Accepted", "Fixed", "False Positive"];
  
  const dynamicSubnets = useMemo(() => {
    const map = new Map<string, string>();
    assetsData.forEach(item => {
      if (item.ip_address) {
        const parts = item.ip_address.split('.');
        if (parts.length === 4) {
          const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
          const subnet = `${prefix}.0/24`;
          const zone = item.network_zone || "Unassigned";
          const val = `${subnet}|${zone}`;
          const label = `${subnet} (${getZoneTranslation(zone)})`;
          map.set(val, label);
        }
      }
    });
    return Array.from(map.entries());
  }, [assetsData]);

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description={t("description")} 
      />
      
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("companyLabel")}</label>
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
                {companyFilter === "All" ? t("allCompanies") : companyFilter}
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
          <label className="text-sm text-text-muted font-medium">{t("severityLabel")}</label>
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
                {severityFilter === "All" ? t("allSeverities") : getSeverityTranslation(severityFilter)}
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
                    {opt === "All" ? t("allSeverities") : getSeverityTranslation(opt)}
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
                {statusFilter === "All" ? t("allStatuses") : getStatusTranslation(statusFilter)}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {statuses.map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setStatusFilter(opt);
                      setIsStatusDropdownOpen(false);
                    }}
                  >
                    {opt === "All" ? t("allStatuses") : getStatusTranslation(opt)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Sort By</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsSortDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[180px] w-[180px]"
            >
              <span className="truncate pr-2">
                {sortFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {["Date (Newest)", "Date (Oldest)", "Severity (Highest)", "Severity (Lowest)"].map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${sortFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setSortFilter(opt);
                      setIsSortDropdownOpen(false);
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
                {zoneFilter === "All" ? t("allZones") : dynamicSubnets.find(([v]) => v === zoneFilter)?.[1] || zoneFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isZoneDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isZoneDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${zoneFilter === "All" ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                  onClick={() => {
                    setZoneFilter("All");
                    setIsZoneDropdownOpen(false);
                  }}
                >
                  {t("allZones")}
                </button>
                {dynamicSubnets.map(([val, label]) => (
                  <button
                    key={val}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${zoneFilter === val ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setZoneFilter(val);
                      setIsZoneDropdownOpen(false);
                    }}
                  >
                    {label}
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
            emptyMessage={t("noData")}
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
                 <StatusBadge status={selectedVuln.severity.toLowerCase() as any} label={getSeverityTranslation(selectedVuln.severity)} />
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
                <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border/50 pb-2">Scanner Logs / Output</h4>
                {selectedVuln.last_scan_raw_output ? (
                  <pre className="text-xs text-text-main bg-base p-4 rounded-lg overflow-x-auto max-h-64 border border-border/50 whitespace-pre-wrap">
                    {selectedVuln.last_scan_raw_output}
                  </pre>
                ) : (
                  <p className="text-sm text-text-muted italic">No logs available for this scan.</p>
                )}
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
            
            <div className="p-6 border-t border-border/50 bg-base/50 flex gap-4">
              <button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  openReportEditor(selectedVuln);
                }} 
                className="flex-1 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Create Report
              </button>
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="flex-1 py-2.5 bg-surface hover:bg-surface-hover border border-border text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Editor Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-base/50 rounded-t-xl">
              <h3 className="font-semibold text-xl">Edit Report Preview</h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-text-muted hover:text-white transition-colors bg-surface p-1.5 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col">
              <p className="text-sm text-text-muted mb-4">
                You can edit the contents of the report below before exporting it as a text file.
              </p>
              <textarea
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                className="w-full flex-1 min-h-[400px] p-4 bg-base border border-border rounded-lg text-sm font-mono text-text-main focus:outline-none focus:border-primary resize-none"
              />
            </div>
            
            <div className="p-6 border-t border-border/50 bg-base/50 rounded-b-xl flex gap-4 justify-end">
              <button 
                onClick={() => setIsReportModalOpen(false)} 
                className="px-6 py-2.5 bg-surface hover:bg-surface-hover border border-border text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleExport} 
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
