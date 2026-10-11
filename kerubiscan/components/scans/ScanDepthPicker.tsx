import React from "react";

// Time the engines may spend on each target (backend: src/scans/domain/depth.py).
// STANDARD is what every scan did before the choice existed.
export const SCAN_DEPTHS = [
  { value: "RAPIDE", label: "Rapide" },
  { value: "STANDARD", label: "Standard" },
  { value: "APPROFONDI", label: "Approfondi" },
];

export function depthLabel(depth?: string | null): string {
  return SCAN_DEPTHS.find((d) => d.value === depth)?.label || "Standard";
}

// What the choice means for the chosen engine (ZAP budgets: 5/3/20, 15/10/90, 30/20/240 min)
const HINTS: Record<string, Record<string, string>> = {
  OWASP_ZAP: {
    RAPIDE: "Jusqu'à 30 min environ par site : exploration et attaques écourtées.",
    STANDARD: "Jusqu'à 2 h environ par site (réglage habituel).",
    APPROFONDI: "Jusqu'à 5 h environ par site, et recherche d'applications sur tous les ports.",
  },
  NETWORK: {
    RAPIDE: "Les 1 000 ports les plus courants au lieu des 65 535.",
    STANDARD: "Tous les ports (réglage habituel).",
    APPROFONDI: "Pour ce moteur, identique à Standard : tous les ports.",
  },
};

interface ScanDepthPickerProps {
  value: string;
  onChange: (value: string) => void;
  engine: string;
}

/** Shown for the engines it changes (ZAP, Nmap, Nuclei): not for OpenVAS nor a discovery. */
export function ScanDepthPicker({ value, onChange, engine }: ScanDepthPickerProps) {
  if (!["OWASP_ZAP", "NMAP", "NUCLEI"].includes(engine)) return null;
  const hints = HINTS[engine === "OWASP_ZAP" ? "OWASP_ZAP" : "NETWORK"];
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-main">Durée du scan</label>
      <div className="flex gap-2" role="radiogroup" aria-label="Durée du scan">
        {SCAN_DEPTHS.map((d) => (
          <button
            key={d.value}
            type="button"
            role="radio"
            aria-checked={value === d.value}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${value === d.value ? "bg-primary/10 border-primary text-primary" : "bg-base border-border text-text-muted hover:border-primary/50"}`}
            onClick={() => onChange(d.value)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-text-muted">{hints[value] || hints.STANDARD}</p>
    </div>
  );
}
