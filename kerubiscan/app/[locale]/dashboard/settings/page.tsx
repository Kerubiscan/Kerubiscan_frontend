"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations("Pages.settings");
  
  const [defaultAi, setDefaultAi] = useState("ollama");
  const [defaultScanner, setDefaultScanner] = useState("OPENVAS");
  const [isSaved, setIsSaved] = useState(false);

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
        <h3 className="text-lg font-medium text-white mb-4">Scanner Configuration</h3>
        <p className="text-text-muted text-sm mb-6">Manage local settings for defaults used during scan creation.</p>
        
        <div className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Default Scanner Engine</label>
              <select value={defaultScanner} onChange={e => setDefaultScanner(e.target.value)} className="w-full bg-base border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary appearance-none">
                <option value="OPENVAS">OpenVAS</option>
                <option value="NMAP">Nmap</option>
                <option value="NUCLEI">Nuclei</option>
                <option value="NESSUS">Nessus</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Default AI Provider</label>
              <select value={defaultAi} onChange={e => setDefaultAi(e.target.value)} className="w-full bg-base border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary appearance-none">
                <option value="ollama">Ollama (Local)</option>
                <option value="openai">OpenAI (Cloud)</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border/50 flex items-center gap-4">
            <button onClick={handleSave} className="px-6 py-2 flex items-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            {isSaved && (
              <span className="text-status-success text-sm font-medium animate-in fade-in">
                Settings saved locally!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
