import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

interface Scan {
  id: string;
  company_id: string;
  name: string;
  target: string;
  network_zone: string | null;
  scanner_engine: string;
  scan_type: string;
  status: string;
  progress: number;
}

interface EditScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scan: Scan | null;
}

export function EditScanModal({ isOpen, onClose, onSuccess, scan }: EditScanModalProps) {
  const t = useTranslations("Pages.scans");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [networkZone, setNetworkZone] = useState("");
  const [scannerEngine, setScannerEngine] = useState("OPENVAS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isScannerDropdownOpen, setIsScannerDropdownOpen] = useState(false);

  const scannerOptions = [
    { value: "OPENVAS", label: "OpenVAS" },
    { value: "NMAP", label: "Nmap" },
    { value: "NUCLEI", label: "Nuclei" },
    { value: "NESSUS", label: "Nessus" },
  ];

  useEffect(() => {
    if (scan) {
      setName(scan.name || "");
      setTarget(scan.target || "");
      setNetworkZone(scan.network_zone || "");
      setScannerEngine(scan.scanner_engine || "OPENVAS");
      setError("");
    }
  }, [scan]);

  if (!isOpen || !scan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) {
      setError("Please fill all required fields");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/v1/scans/${scan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          target: target,
          network_zone: networkZone || null,
          scanner_engine: scannerEngine,
        }),
      });

      if (!res.ok) throw new Error("Failed to update scan");
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border w-full max-w-md rounded-xl shadow-xl overflow-visible animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-text-main">{t("edit") || "Edit Scan"}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 bg-status-critical/10 border border-status-critical/20 text-status-critical text-sm rounded-lg">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-main">Name</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-base border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-main">Target</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-base border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-main">{t("networkZone") || "Network Zone"}</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-base border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder={t("customZonePlaceholder") || "Custom Zone (e.g. Main Office)"}
              value={networkZone}
              onChange={(e) => setNetworkZone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-main">{t("scannerEngine") || "Scanner Engine"}</label>
            <div 
              className="relative" 
              tabIndex={0} 
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsScannerDropdownOpen(false);
                }
              }}
            >
              <button
                type="button"
                onClick={() => setIsScannerDropdownOpen(!isScannerDropdownOpen)}
                className="flex items-center justify-between w-full px-3 py-2 bg-base border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <span className="truncate pr-2">
                  {scannerOptions.find(o => o.value === scannerEngine)?.label || "Select Scanner"}
                </span>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isScannerDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isScannerDropdownOpen && (
                <div className="absolute z-10 bottom-full mb-1 left-0 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {scannerOptions.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors truncate ${scannerEngine === o.value ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                      onClick={() => {
                        setScannerEngine(o.value);
                        setIsScannerDropdownOpen(false);
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-transparent text-text-main hover:bg-base rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
