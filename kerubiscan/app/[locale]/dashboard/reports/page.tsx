"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Download, ChevronDown, Bot, FileText, Check, Loader2, Save } from "lucide-react";
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
  
  // AI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [language, setLanguage] = useState("French");
  const [aiInstructions, setAiInstructions] = useState("");
  const [isAiApproved, setIsAiApproved] = useState(false);
  
  useEffect(() => {
    // Fetch companies for sorting/filtering
    fetchApi<any>("/companies?size=500").then(data => {
      setCompanies(data?.items || []);
    }).catch(console.error);

    fetchApi<any[]>("/scans?status=COMPLETED").then(data => {
      setScans(data || []);
      if (data && data.length > 0) {
        setSelectedScanId(data[0].id);
        setAiSummary(data[0].executive_summary || "");
        setIsAiApproved(!!data[0].executive_summary);
      }
    }).catch(console.error);
  }, []);

  const selectedScan = scans.find(s => s.id === selectedScanId);

  const filteredScans = useMemo(() => {
    if (selectedCompanyId === "All") return scans;
    return scans.filter(s => s.company_id === selectedCompanyId);
  }, [scans, selectedCompanyId]);

  const handleGenerateSummary = async () => {
    if (!selectedScanId) return;
    
    setIsGenerating(true);
    try {
      const url = `/scans/${selectedScanId}/generate-summary`;
        
      const res = await fetchApi<any>(url, {
        method: "POST",
        body: JSON.stringify({ language, instructions: aiInstructions })
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
    window.open(`/api/v1/scans/${id}/report/html`, "_blank");
  };

  const columns = [
    { header: t("targetCol"), accessor: "target" as const, className: "font-medium" },
    { 
      header: "Company", 
      accessor: (row: any) => {
        const comp = companies.find(c => c.id === row.company_id);
        return comp ? comp.name : "Unknown";
      } 
    },
    { header: t("typeCol"), accessor: "scan_type" as const },
    { header: t("statusCol"), accessor: "status" as const },
    { header: t("generatedOnCol"), accessor: "created_at" as const, className: "text-text-muted",
      cell: (row: any) => new Date(row.created_at || new Date()).toLocaleString()
    },
    { 
      header: t("actionCol"), 
      accessor: (row: any) => (
        <button 
          onClick={() => handleDownloadHtml(row.id)}
          disabled={row.status !== "COMPLETED"}
          className={`flex items-center gap-1 transition-colors ${row.status === "COMPLETED" ? "text-primary hover:text-primary-hover" : "text-gray-400 cursor-not-allowed"}`}
        >
          <Download className="w-4 h-4" /> {t("downloadAction")}
        </button>
      )
    },
  ];

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description={t("description")} 
        action={
          <button 
            onClick={() => handleDownloadHtml()} 
            disabled={!selectedScanId || selectedScan?.status !== "COMPLETED"}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            Download HTML
          </button>
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

        {/* Company Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Filter by Company:</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              setSelectedScanId(null);
            }}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[150px]"
          >
            <option value="All">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
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
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
              >
                <option value="French">French</option>
                <option value="English">English</option>
              </select>
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
