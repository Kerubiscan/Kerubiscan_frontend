"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { Save, ChevronDown } from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations("Pages.settings");
  
  const [defaultAi, setDefaultAi] = useState("ollama");
  const [defaultScanner, setDefaultScanner] = useState("OPENVAS");
  const [isSaved, setIsSaved] = useState(false);
  const [isScannerDropdownOpen, setIsScannerDropdownOpen] = useState(false);
  const [isAiDropdownOpen, setIsAiDropdownOpen] = useState(false);

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
                  <span>{defaultScanner === "OPENVAS" ? "OpenVAS" : defaultScanner === "NMAP" ? "Nmap" : defaultScanner === "NUCLEI" ? "Nuclei" : "Nessus"}</span>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isScannerDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isScannerDropdownOpen && (
                  <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in">
                    {[
                      { value: "OPENVAS", label: "OpenVAS" },
                      { value: "NMAP", label: "Nmap" },
                      { value: "NUCLEI", label: "Nuclei" },
                      { value: "NESSUS", label: "Nessus" }
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
    </div>
  );
}
