import React from "react";
import { X, Calendar, Server, Shield, Activity, Fingerprint } from "lucide-react";

interface Scan {
  id: string;
  company_id: string;
  name: string;
  target: string;
  scan_type: string;
  status: string;
  network_zone: string | null;
  scanner_engine: string;
  created_at?: string;
}

interface ViewScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  scan: Scan | null;
}

export function ViewScanModal({ isOpen, onClose, scan }: ViewScanModalProps) {
  if (!isOpen || !scan) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md h-full bg-surface border-l border-border shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-base/50">
          <h2 className="text-lg font-semibold text-text-main">Scan Details</h2>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="bg-base rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-primary" /> Company ID
              </span>
              <span className="text-sm font-medium text-text-main">{scan.company_id}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" /> Target
              </span>
              <span className="text-sm font-medium text-text-main">{scan.target}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Scanner Engine
              </span>
              <span className="text-sm font-medium text-text-main">{scan.scanner_engine}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Network Zone
              </span>
              <span className="text-sm font-medium text-text-main">{scan.network_zone || "N/A"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Created At
              </span>
              <span className="text-sm font-medium text-text-main">
                {scan.created_at ? new Date(scan.created_at).toLocaleString() : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
