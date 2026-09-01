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
  
  const [scans, setScans] = useState<any[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
  const [isScanDropdownOpen, setIsScanDropdownOpen] = useState(false);
  
  const [aiSummary, setAiSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [language, setLanguage] = useState("French");
  const [aiInstructions, setAiInstructions] = useState("");
  const [isAiApproved, setIsAiApproved] = useState(false);
  
  const [scannerCompany, setScannerCompany] = useState("Kerubiscan Security");
  const [targetCompany, setTargetCompany] = useState("Client Company");

  useEffect(() => {
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

  const handleGenerateSummary = async () => {
    if (!selectedScanId) return;
    setIsGenerating(true);
    try {
      const res = await fetchApi<any>(`/scans/${selectedScanId}/generate-summary`, {
        method: "POST",
        body: JSON.stringify({ language, instructions: aiInstructions })
      });
      setAiSummary(res.executive_summary);
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

  const handleDownloadPdf = (scanIdToDownload?: number) => {
    const id = scanIdToDownload || selectedScanId;
    if (!id) return;
    window.open(`/api/v1/scans/${id}/report/pdf?scanner_company=${encodeURIComponent(scannerCompany)}&target_company=${encodeURIComponent(targetCompany)}`, "_blank");
  };

  const columns = [
    { header: "Target", accessor: "target" as const, className: "font-medium" },
    { header: "Type", accessor: "scan_type" as const },
    { header: "Status", accessor: "status" as const },
    { header: "Generated On", accessor: "created_at" as const, className: "text-text-muted",
      cell: (row: any) => new Date(row.created_at || new Date()).toLocaleString()
    },
    { 
      header: "Action", 
      accessor: (row: any) => (
        <button 
          onClick={() => handleDownloadPdf(row.id)}
          className="text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
        >
          <Download className="w-4 h-4" /> Download
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
            onClick={() => handleDownloadPdf()} 
            disabled={!selectedScanId}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            <FileText className="w-4 h-4" />
            Download PDF Report
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Select Scan:</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsScanDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsScanDropdownOpen(!isScanDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[300px] w-full"
            >
              <span className="truncate pr-2">
                {selectedScan ? `${selectedScan.target} (${new Date(selectedScan.created_at || new Date()).toLocaleString()})` : "Select a scan"}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isScanDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isScanDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {scans.map(s => (
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
          <label className="text-sm text-text-muted font-medium">Scanner Company:</label>
          <input 
            type="text" 
            value={scannerCompany}
            onChange={(e) => setScannerCompany(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors w-[200px]"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Target Company:</label>
          <input 
            type="text" 
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors w-[200px]"
          />
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

      <h3 className="text-lg font-semibold mb-4 mt-8">Completed Scans History</h3>
      <DataTable 
        columns={columns} 
        data={scans} 
        keyField="id" 
      />
    </div>
  );
}
