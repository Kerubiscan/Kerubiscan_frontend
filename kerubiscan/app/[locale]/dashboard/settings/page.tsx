"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { Save, ChevronDown, RefreshCw } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function SettingsPage() {
  const t = useTranslations("Pages.settings");
  
  const [defaultAi, setDefaultAi] = useState("ollama");
  const [defaultScanner, setDefaultScanner] = useState("OPENVAS");
  const [isSaved, setIsSaved] = useState(false);
  const [isScannerDropdownOpen, setIsScannerDropdownOpen] = useState(false);
  const [isAiDropdownOpen, setIsAiDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedAi = localStorage.getItem("kerubiscan_default_ai");
    const savedScanner = localStorage.getItem("kerubiscan_default_scanner");
    if (savedAi) setDefaultAi(savedAi);
    if (savedScanner) setDefaultScanner(savedScanner);
  }, []);

  const handleSave = () => {
    localStorage.setItem("kerubiscan_default_ai", defaultAi);
    localStorage.setItem("kerubiscan_default_scanner", defaultScanner);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleUpdateScanner = async (engine: string) => {
    setIsUpdating(engine);
    setUpdateMessage(null);
    try {
      await fetchApi("/scans/scanners/update", {
        method: "POST",
        body: JSON.stringify({ engine })
      });
      setUpdateMessage(`${engine} update started in the background.`);
    } catch (err) {
      console.error(err);
      setUpdateMessage(`Failed to trigger ${engine} update.`);
    } finally {
      setIsUpdating(null);
      setTimeout(() => setUpdateMessage(null), 3000);
    }
  };

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description={t("description")} 
      />
      
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4">{t("scannerConfigTitle")}</h3>
        <p className="text-text-muted text-sm mb-6">{t("scannerConfigDesc")}</p>
        
        <div className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">{t("defaultScannerLabel")}</label>
              <div 
                className="relative" 
                tabIndex={0} 
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsScannerDropdownOpen(false);
                }}
              >
                <button
                  onClick={() => setIsScannerDropdownOpen(!isScannerDropdownOpen)}
                  className="flex items-center justify-between w-full bg-base border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                >
                  <span>{defaultScanner === "OPENVAS" ? "OpenVAS" : defaultScanner === "NMAP" ? "Nmap" : "Nuclei"}</span>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isScannerDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isScannerDropdownOpen && (
                  <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in">
                    {[
                      { value: "OPENVAS", label: "OpenVAS" },
                      { value: "NMAP", label: "Nmap" },
                      { value: "NUCLEI", label: "Nuclei" }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-base transition-colors ${defaultScanner === opt.value ? "bg-primary/10 text-primary" : "text-white"}`}
                        onClick={() => { setDefaultScanner(opt.value); setIsScannerDropdownOpen(false); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">{t("defaultAiLabel")}</label>
              <div 
                className="relative" 
                tabIndex={0} 
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsAiDropdownOpen(false);
                }}
              >
                <button
                  onClick={() => setIsAiDropdownOpen(!isAiDropdownOpen)}
                  className="flex items-center justify-between w-full bg-base border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                >
                  <span>{defaultAi === "ollama" ? "Ollama (Local)" : "OpenAI (Cloud)"}</span>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isAiDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isAiDropdownOpen && (
                  <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in">
                    {[
                      { value: "ollama", label: "Ollama (Local)" },
                      { value: "openai", label: "OpenAI (Cloud)" }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-base transition-colors ${defaultAi === opt.value ? "bg-primary/10 text-primary" : "text-white"}`}
                        onClick={() => { setDefaultAi(opt.value); setIsAiDropdownOpen(false); }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border/50 flex items-center gap-4">
            <button onClick={handleSave} className="px-6 py-2 flex items-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
              <Save className="w-4 h-4" />
              {t("saveChanges")}
            </button>
            {isSaved && (
              <span className="text-status-success text-sm font-medium animate-in fade-in">
                {t("settingsSaved")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 mt-6">
        <h3 className="text-lg font-medium text-white mb-4">Scanner Updates</h3>
        <p className="text-text-muted text-sm mb-6">Manually trigger database and template updates for local scanners (Nmap, Nuclei, ZAP).</p>
        
        <div className="space-y-4 max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => handleUpdateScanner("ALL")}
              disabled={isUpdating !== null}
              className="flex-1 px-4 py-2 flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating === "ALL" ? "animate-spin" : ""}`} />
              Update All Scanners
            </button>
            <button 
              onClick={() => handleUpdateScanner("NMAP")}
              disabled={isUpdating !== null}
              className="flex-1 px-4 py-2 flex justify-center items-center gap-2 bg-base border border-border hover:bg-base-light disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating === "NMAP" ? "animate-spin" : ""}`} />
              Update Nmap
            </button>
            <button 
              onClick={() => handleUpdateScanner("NUCLEI")}
              disabled={isUpdating !== null}
              className="flex-1 px-4 py-2 flex justify-center items-center gap-2 bg-base border border-border hover:bg-base-light disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating === "NUCLEI" ? "animate-spin" : ""}`} />
              Update Nuclei
            </button>
            <button 
              onClick={() => handleUpdateScanner("ZAP")}
              disabled={isUpdating !== null}
              className="flex-1 px-4 py-2 flex justify-center items-center gap-2 bg-base border border-border hover:bg-base-light disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating === "ZAP" ? "animate-spin" : ""}`} />
              Update ZAP
            </button>
          </div>
          {updateMessage && (
            <div className="text-status-success text-sm font-medium animate-in fade-in">
              {updateMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
