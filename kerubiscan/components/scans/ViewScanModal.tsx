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
  target_states?: Record<string, string>;
  created_at?: string;
}

type Tone = "success" | "warning" | "critical" | "info";

const TONES: Record<Tone, string> = {
  success: "bg-status-success/10 text-status-success",
  warning: "bg-status-warning/10 text-status-warning",
  critical: "bg-status-critical/10 text-status-critical",
  info: "bg-status-info/10 text-status-info",
};

// Per-target outcome reported by the backend. "No vulnerability" and "not scanned" are distinct.
const TARGET_STATES: Record<string, { label: string; hint: string; tone: Tone }> = {
  PENDING: { label: "En attente", hint: "", tone: "info" },
  IN_PROGRESS: { label: "En cours", hint: "", tone: "warning" },
  COMPLETED: { label: "Scanné", hint: "", tone: "success" },
  NO_OPEN_PORTS: { label: "Aucun port ouvert", hint: "L'hôte répond mais aucun service n'a pu être testé.", tone: "warning" },
  NO_WEB_SERVICE: { label: "Aucun service web", hint: "Aucun service HTTP(S) trouvé : rien à tester pour ce moteur web.", tone: "warning" },
  TIMEOUT: { label: "Délai dépassé", hint: "Le scan n'a pas pu se terminer (lien lent, pare-feu ou WAF). Résultats incomplets.", tone: "critical" },
  HOST_UNREACHABLE: { label: "Injoignable", hint: "Résolution DNS impossible ou hôte injoignable : non scanné.", tone: "critical" },
  INVALID_TARGET: { label: "Cible invalide", hint: "Format non reconnu : IP, réseau, domaine ou URL http(s).", tone: "critical" },
  INTERRUPTED: { label: "Interrompu", hint: "Le scan OpenVAS a été arrêté : résultats partiels.", tone: "critical" },
  FAILED: { label: "Échec", hint: "Le moteur a échoué : non scanné. Consultez les logs du worker.", tone: "critical" },
  ABANDONED: { label: "Échec", hint: "Le moteur a échoué : non scanné.", tone: "critical" },
};

interface Company {
  id: string;
  name: string;
}

interface ViewScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  scan: Scan | null;
  companies?: Company[];
}

export function ViewScanModal({ isOpen, onClose, scan, companies = [] }: ViewScanModalProps) {
  if (!isOpen || !scan) return null;

  const companyName = companies.find((c) => c.id === scan.company_id)?.name || scan.company_id;

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
                <Fingerprint className="w-4 h-4 text-primary" /> Company
              </span>
              <span className="text-sm font-medium text-text-main">{companyName}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted flex items-center gap-2 whitespace-nowrap">
                <Server className="w-4 h-4 text-primary shrink-0" /> Target
              </span>
              <span className="text-sm font-medium text-text-main break-all text-right ml-4">
                {scan.target.includes(',') ? `${scan.target.split(',').length} Targets (See below)` : scan.target}
              </span>
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

          {scan.target_states && Object.keys(scan.target_states).length > 0 && (
            <div className="bg-base rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-text-main flex items-center gap-2 border-b border-border/50 pb-2">
                <Activity className="w-4 h-4 text-primary" /> Multi-Target Status
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {Object.entries(scan.target_states).map(([ip, status]) => {
                  const state = TARGET_STATES[status] ?? { label: status, hint: "", tone: "info" as const };
                  return (
                    <div key={ip} className="border-b border-border/20 pb-1 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-text-muted break-all">{ip}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${TONES[state.tone]}`}>
                          {state.label}
                        </span>
                      </div>
                      {state.hint && <p className="text-[11px] text-text-muted mt-0.5">{state.hint}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
