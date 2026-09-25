"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Download, ChevronDown, Bot, FileText, Check, Loader2, Save, Trash2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

export default function ReportsPage() {
  const t = useTranslations("Pages.reports");
  
  // Scan & Company state
  const [scans, setScans] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [isScanDropdownOpen, setIsScanDropdownOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("All");
  
  // Advanced filters
  const [scannerFilter, setScannerFilter] = useState("All");
  const [assetFilter, setAssetFilter] = useState("All");
  const [scanTypeFilter, setScanTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  
  // Dropdown states
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isScannerDropdownOpen, setIsScannerDropdownOpen] = useState(false);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isScanTypeDropdownOpen, setIsScanTypeDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  // AI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [language, setLanguage] = useState("French");
  const [aiInstructions, setAiInstructions] = useState("");
  const [isAiApproved, setIsAiApproved] = useState(false);
  
  useEffect(() => {
    // Fetch companies for sorting/filtering — use /scans/companies which is the registered endpoint
    fetchApi<any[]>("/scans/companies").then(data => {
      setCompanies(data || []);
    }).catch(console.error);

    fetchApi<any[]>("/scans?status=COMPLETED").then(data => {
      setScans(data || []);
      if (data && data.length > 0) {
        setSelectedScanId(data[0].id);
        setAiSummary(data[0].executive_summary || "");
        setIsAiApproved(!!data[0].executive_summary);
      }
    }).catch(console.error);
    
    const savedLang = localStorage.getItem("kerubiscan_default_language");
    if (savedLang) setLanguage(savedLang);
  }, []);

  const selectedScan = scans.find(s => s.id === selectedScanId);

  const filteredScans = useMemo(() => {
    let result = scans;
    if (selectedCompanyId !== "All") result = result.filter(s => s.company_id === selectedCompanyId);
    if (scannerFilter !== "All") result = result.filter(s => (s.source_engine || "OPENVAS").toUpperCase() === scannerFilter);
    if (assetFilter !== "All") result = result.filter(s => s.target === assetFilter);
    if (scanTypeFilter !== "All") result = result.filter(s => (s.scan_type || "").toUpperCase() === scanTypeFilter.toUpperCase());
    if (dateFilter) {
      result = result.filter(s => {
        const d = new Date(s.created_at || new Date());
        return d.toISOString().split('T')[0] === dateFilter;
      });
    }
    return result;
  }, [scans, selectedCompanyId, scannerFilter, assetFilter, scanTypeFilter, dateFilter]);

  const uniqueAssets = useMemo(() => Array.from(new Set(scans.map(s => s.target))), [scans]);

  const handleGenerateSummary = async () => {
    if (!selectedScanId) return;
    
    setIsGenerating(true);
    try {
      const url = `/scans/${selectedScanId}/generate-summary`;
        
      const provider = localStorage.getItem("kerubiscan_default_ai") || "ollama";
      
      const res = await fetchApi<any>(url, {
        method: "POST",
        body: JSON.stringify({ language, instructions: aiInstructions, provider })
      });
      
      const taskId = res.task_id;
      if (!taskId) throw new Error("No task ID returned");
      
      toast.info("AI is generating summary... this may take a minute.");
      
      let status = "PENDING";
      let summaryResult = "";
      while (status === "PENDING" || status === "STARTED" || status === "processing") {
        await new Promise(r => setTimeout(r, 5000));
        const taskRes = await fetchApi<any>(`/scans/tasks/${taskId}`);
        if (taskRes.status === "SUCCESS") {
          status = "SUCCESS";
          summaryResult = taskRes.result;
        } else if (taskRes.status === "FAILURE") {
          throw new Error("Task failed");
        } else {
          status = taskRes.status;
        }
      }
      
      setAiSummary(summaryResult);
      setIsAiApproved(true);
      toast.success("Summary generated successfully");
    } catch (e) {
      toast.error("Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!selectedScanId) return;
    setIsSaving(true);
    try {
      await fetchApi<any>(`/scans/${selectedScanId}/summary`, {
        method: "PUT",
        body: JSON.stringify({ summary: aiSummary })
      });
      setIsAiApproved(true);
      toast.success("Summary saved successfully");
    } catch (e) {
      toast.error("Failed to save summary");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadHtml = async (scanIdToDownload?: number) => {
    const id = scanIdToDownload || selectedScanId;
    if (!id) return;
    try {
      // Use fetchApi so the Authorization token is included in the request
      const response = await fetch(`/api/v1/scans/${id}/report/html`, {
        headers: {
          Authorization: `Bearer ${(await import("next-auth/react").then(m => m.getSession()))?.accessToken as string ?? ""}`,
        },
      });
      if (!response.ok) {
        toast.error(`Failed to download report: ${response.status} ${response.statusText}`);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Failed to download report");
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm("Are you sure you want to delete this report and its scan?")) return;
    try {
      await fetchApi(`/scans/${id}`, { method: "DELETE" });
      setScans(prev => prev.filter(s => s.id !== id));
      if (selectedScanId === id) {
        setSelectedScanId(null);
        setAiSummary("");
      }
      toast.success("Report deleted successfully");
    } catch (e) {
      toast.error("Failed to delete report");
    }
  };

  const handleDeleteAllReports = async () => {
    if (!confirm("Are you sure you want to delete ALL reports? This action cannot be undone.")) return;
    try {
      await Promise.all(filteredScans.map(s => fetchApi(`/scans/${s.id}`, { method: "DELETE" })));
      setScans(prev => prev.filter(s => !filteredScans.some(fs => fs.id === s.id)));
      setSelectedScanId(null);
      setAiSummary("");
      toast.success("All reports deleted successfully");
    } catch (e) {
      toast.error("Failed to delete all reports");
    }
  };

  const columns = [
    { 
      header: t("targetCol"), 
      className: "font-medium",
      accessor: (row: any) => {
        if (row.target && row.target.includes(",")) {
          const count = row.target.split(",").length;
          return (
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                {count} Targets
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
    { 
      header: "Company", 
      accessor: (row: any) => {
        const comp = companies.find(c => c.id === row.company_id);
        return comp ? comp.name : "Unknown";
      } 
    },
    { header: t("typeCol"), accessor: "scan_type" as const },
    { header: t("statusCol"), accessor: "status" as const },
    { header: t("generatedOnCol"), className: "text-text-muted",
      accessor: (row: any) => {
        const d = new Date(row.created_at || new Date());
        return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    },
    { 
      header: t("actionCol"), 
      accessor: (row: any) => (
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleDownloadHtml(row.id)}
            disabled={row.status !== "COMPLETED"}
            className={`flex items-center gap-1 transition-colors ${row.status === "COMPLETED" ? "text-primary hover:text-primary-hover" : "text-gray-400 cursor-not-allowed"}`}
          >
            <Download className="w-4 h-4" /> {t("downloadAction")}
          </button>
          <button 
            onClick={() => handleDeleteReport(row.id)}
            className="p-1 text-text-muted hover:text-red-500 transition-colors"
            title="Delete Report"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description={t("description")} 
        action={
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDeleteAllReports}
              disabled={filteredScans.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-600/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
            <button 
              onClick={() => handleDownloadHtml()} 
              disabled={!selectedScanId || selectedScan?.status !== "COMPLETED"}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              Download HTML
            </button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("selectScanLabel")}</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsScanDropdownOpen(false);
            }}
          >
            <button
              onClick={() => setIsScanDropdownOpen(!isScanDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[300px] w-full"
            >
              <span className="truncate pr-2">
                {selectedScan ? `${selectedScan.target} (${new Date(selectedScan.created_at || new Date()).toLocaleString()})` : t("selectScanPlaceholder")}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isScanDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isScanDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {filteredScans.map(s => (
                  <button
                    key={s.id}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors truncate ${selectedScanId === s.id ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setSelectedScanId(s.id);
                      setAiSummary(s.executive_summary || "");
                      setIsAiApproved(!!s.executive_summary);
                      setIsScanDropdownOpen(false);
                    }}
                  >
                    {s.target} - {new Date(s.created_at || new Date()).toLocaleString()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Filter by Company:</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsCompanyDropdownOpen(false);
            }}
          >
            <button
              onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[150px]"
            >
              <span className="truncate pr-2">
                {selectedCompanyId === "All" ? "All Companies" : companies.find(c => c.id === selectedCompanyId)?.name || "Unknown"}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCompanyDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${selectedCompanyId === "All" ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                  onClick={() => { setSelectedCompanyId("All"); setSelectedScanId(null); setIsCompanyDropdownOpen(false); }}
                >
                  All Companies
                </button>
                {companies.map(c => (
                  <button
                    key={c.id}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${selectedCompanyId === c.id ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => { setSelectedCompanyId(c.id); setSelectedScanId(null); setIsCompanyDropdownOpen(false); }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Scanner:</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsScannerDropdownOpen(false);
            }}
          >
            <button
              onClick={() => setIsScannerDropdownOpen(!isScannerDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[150px]"
            >
              <span className="truncate pr-2">{scannerFilter}</span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isScannerDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isScannerDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {["All", "OPENVAS", "NMAP", "NUCLEI", "ZAP"].map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${scannerFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => { setScannerFilter(opt); setSelectedScanId(null); setIsScannerDropdownOpen(false); }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Scan Type:</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsScanTypeDropdownOpen(false);
            }}
          >
            <button
              onClick={() => setIsScanTypeDropdownOpen(!isScanTypeDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px]"
            >
              <span className="truncate pr-2">{scanTypeFilter === "All" ? "All Types" : scanTypeFilter}</span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isScanTypeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isScanTypeDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {["All", "DISCOVERY", "VULNERABILITY"].map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${scanTypeFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => { setScanTypeFilter(opt); setSelectedScanId(null); setIsScanTypeDropdownOpen(false); }}
                  >
                    {opt === "All" ? "All Types" : opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Asset:</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsAssetDropdownOpen(false);
            }}
          >
            <button
              onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px]"
            >
              <span className="truncate pr-2">{assetFilter === "All" ? "All Assets" : assetFilter}</span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isAssetDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isAssetDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${assetFilter === "All" ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                  onClick={() => { setAssetFilter("All"); setSelectedScanId(null); setIsAssetDropdownOpen(false); }}
                >
                  All Assets
                </button>
                {uniqueAssets.map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors truncate ${assetFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => { setAssetFilter(opt); setSelectedScanId(null); setIsAssetDropdownOpen(false); }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setSelectedScanId(null); }}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
          />
          {dateFilter && (
            <button onClick={() => { setDateFilter(""); setSelectedScanId(null); }} className="text-xs text-primary hover:underline">Clear</button>
          )}
        </div>
      </div>

      {selectedScan && (
        <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-text-main">AI Executive Summary Builder</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Language</label>
              <div 
                className="relative" 
                tabIndex={0} 
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsLanguageDropdownOpen(false);
                }}
              >
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="flex items-center justify-between w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
                >
                  <span className="truncate pr-2">{language}</span>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isLanguageDropdownOpen && (
                  <div className="absolute z-10 top-full left-0 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {["French", "English"].map(opt => (
                      <button
                        key={opt}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${language === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                        onClick={() => { setLanguage(opt); setIsLanguageDropdownOpen(false); }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Custom Instructions for AI (Optional)</label>
              <input 
                type="text"
                placeholder="e.g. Focus on PCI-DSS compliance..."
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          
          <button 
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors mb-4"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
            {isGenerating ? "Generating via LLM..." : "Generate Summary"}
          </button>

          <p className="text-xs text-text-muted mb-2">Edit the text below and save to approve it for the final PDF.</p>
          <textarea 
            value={aiSummary}
            onChange={(e) => {
              setAiSummary(e.target.value);
              setIsAiApproved(false);
            }}
            className="w-full bg-surface border border-border rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-h-[150px] mb-3"
          />
          
          <div className="flex gap-3">
            <button 
              onClick={handleSaveSummary}
              disabled={isSaving || !aiSummary}
              className="flex items-center gap-1.5 px-4 py-2 bg-status-success/20 text-status-success hover:bg-status-success/30 rounded-lg text-sm font-medium transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
              Save & Approve
            </button>
            {isAiApproved && (
              <span className="flex items-center gap-1.5 px-3 py-2 text-status-success text-sm font-medium">
                <Check className="w-4 h-4" /> Approved
              </span>
            )}
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-4 mt-8">{t("historyTitle")}</h3>
      <DataTable 
        columns={columns} 
        data={filteredScans} 
        keyField="id" 
        emptyMessage={t("noData")}
      />
    </div>
  );
}
