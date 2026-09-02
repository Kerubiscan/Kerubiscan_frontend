"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DatePicker } from "@/components/ui/DatePicker";
import { Plus, ChevronDown, X, Eye, Pencil, Trash2, Loader2, ScanSearch } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function AssetsPage() {
  const t = useTranslations("Pages.assets");
  
  const [criticalityFilter, setCriticalityFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isCriticalityDropdownOpen, setIsCriticalityDropdownOpen] = useState(false);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isEngineDropdownOpen, setIsEngineDropdownOpen] = useState(false);
  const [isDiscoveryEngineDropdownOpen, setIsDiscoveryEngineDropdownOpen] = useState(false);

  const [assetsData, setAssetsData] = useState<any[]>([]);
  const [companiesData, setCompaniesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [exposureData, setExposureData] = useState<{date: string, count: number}[]>([]);
  const [assetVulnerabilities, setAssetVulnerabilities] = useState<any[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string | number>>(new Set());
  
  const [newAsset, setNewAsset] = useState({
    name: "",
    ip_address: "",
    company_id: "",
    criticality: "Medium",
    network_zone: "Internal",
    environment: "Production",
    asset_type: "Server",
    operating_system: "Linux",
    mac_address: ""
  });

  const [addMode, setAddMode] = useState("MANUAL");
  const [discoverySubnet, setDiscoverySubnet] = useState("");
  const [discoveryZone, setDiscoveryZone] = useState("Internal");
  const [discoveryEngine, setDiscoveryEngine] = useState("OPENVAS");
  const [vulnEngine, setVulnEngine] = useState("OPENVAS");

  // Fetch Companies
  const loadCompanies = async () => {
    try {
      const data = await fetchApi<any[]>("/scans/companies");
      setCompaniesData(data);
    } catch (err) {
      console.error("Failed to fetch companies", err);
    }
  };

  // Fetch Assets
  const loadAssets = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi<any>("/assets?size=500");
      setAssetsData(data.items || []);
    } catch (err) {
      console.error("Failed to fetch assets", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
    loadAssets();
  }, []);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (addMode === "MANUAL") {
        await fetchApi("/assets/", {
          method: "POST",
          body: JSON.stringify({
            ...newAsset,
            company_id: newAsset.company_id ? parseInt(newAsset.company_id) : null
          })
        });
      } else {
        await fetchApi("/scans", {
          method: "POST",
          body: JSON.stringify({
            company_name: "KerubiScan",
            target: discoverySubnet,
            network_zone: discoveryZone,
            scan_type: "DISCOVERY",
            scanner_engine: discoveryEngine
          })
        });
      }
      setIsAddModalOpen(false);
      setNewAsset({ name: "", ip_address: "", company_id: "", criticality: "Medium", network_zone: "Internal", environment: "Production", asset_type: "Server", operating_system: "Linux", mac_address: "" });
      setDiscoverySubnet("");
      loadAssets(); // Refresh
    } catch (err) {
      console.error("Failed to create asset", err);
      alert("Failed to create asset. It may already exist.");
    }
  };

  const handleEditAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    try {
      await fetchApi(`/assets/${editingAsset.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editingAsset.name,
          ip_address: editingAsset.ip_address,
          company_id: editingAsset.company_id ? parseInt(editingAsset.company_id) : null,
          criticality: editingAsset.criticality,
          network_zone: editingAsset.network_zone,
          environment: editingAsset.environment,
          asset_type: editingAsset.asset_type,
          operating_system: editingAsset.operating_system,
          mac_address: editingAsset.mac_address
        })
      });
      setIsEditModalOpen(false);
      setEditingAsset(null);
      loadAssets();
    } catch (err) {
      console.error("Failed to edit asset", err);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    try {
      await fetchApi(`/assets/${id}`, { method: "DELETE" });
      loadAssets();
    } catch (err) {
      console.error("Failed to delete asset", err);
      alert("Failed to delete asset.");
    }
  };

  const handleScanAssets = async (assetIp?: string) => {
    try {
      const ipsToScan = assetIp 
        ? [assetIp] 
        : assetsData.filter(a => selectedAssetIds.has(String(a.id))).map(a => a.ip_address);
        
      if (ipsToScan.length === 0) return;

      if (!confirm(`Queue Vulnerability Scan for ${ipsToScan.length} asset(s)?`)) return;

      for (const ip of ipsToScan) {
        await fetchApi("/scans", {
          method: "POST",
          body: JSON.stringify({
            company_name: "KerubiScan",
            target: ip,
            network_zone: "Internal",
            scan_type: "VULNERABILITY",
            scanner_engine: vulnEngine
          })
        });
      }
      
      alert(`Successfully queued ${ipsToScan.length} scan(s). Check the Scans page for progress.`);
      if (!assetIp) setSelectedAssetIds(new Set());
    } catch (err) {
      console.error("Failed to queue scans", err);
      alert("Failed to queue scans.");
    }
  };

  const columns = [
    { header: t("hostnameCol"), accessor: "name" as const, className: "font-medium" },
    { header: t("ipAddressCol"), accessor: "ip_address" as const, className: "text-text-muted" },
    { header: t("osCol"), accessor: (row: any) => row.operating_system || "-", className: "" },
    { 
      header: t("companyCol"), 
      accessor: (row: any) => {
        if (!row.company_id) return "-";
        const c = companiesData.find(c => c.id === row.company_id);
        return c ? c.name : `Company ${row.company_id}`;
      }, 
      className: "text-text-muted" 
    },
    { 
      header: t("criticalityCol"), 
      accessor: (row: any) => {
        let variant = "info";
        let label = t("critUnassigned");
        
        if (row.criticality === "Critical") { variant = "critical"; label = t("critCritical"); }
        if (row.criticality === "High") { variant = "high"; label = t("critHigh"); }
        if (row.criticality === "Medium") { variant = "medium"; label = t("critMedium"); }
        if (row.criticality === "Low") { variant = "low"; label = t("critLow"); }
        
        return <StatusBadge status={variant as any} label={label} />;
      }
    },
    {
      header: t("actionsCol"),
      accessor: (row: any) => (
        <div className="flex items-center gap-1">
          <button 
            onClick={async () => { 
              setSelectedAsset(row); 
              setIsViewModalOpen(true); 
              try {
                const [exposureRes, vulnsRes] = await Promise.all([
                  fetchApi<any[]>(`/assets/${row.id}/exposure`),
                  fetchApi<any>(`/vulnerabilities?asset_id=${row.id}&size=100`)
                ]);
                setExposureData(exposureRes);
                setAssetVulnerabilities(vulnsRes.items || []);
              } catch (e) {
                console.error("Failed to fetch asset details", e);
                setExposureData([]);
                setAssetVulnerabilities([]);
              }
            }}
            className="p-1 text-text-muted hover:text-primary transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleScanAssets(row.ip_address)}
            className="p-1 text-text-muted hover:text-blue-500 transition-colors"
            title="Scan Asset"
          >
            <ScanSearch className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { setEditingAsset({...row}); setIsEditModalOpen(true); }}
            className="p-1 text-text-muted hover:text-primary transition-colors"
            title="Edit Asset"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeleteAsset(row.id)}
            className="p-1 text-text-muted hover:text-red-500 transition-colors"
            title="Delete Asset"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const filteredData = useMemo(() => {
    return assetsData.filter(item => {
      const itemCompanyName = item.company_id 
        ? companiesData.find(c => c.id === item.company_id)?.name || "" 
        : "";

      const matchCriticality = criticalityFilter === "All" || item.criticality === criticalityFilter;
      const matchCompany = companyFilter === "All" || itemCompanyName === companyFilter;
      let matchZone = true;
      if (zoneFilter !== "All") {
        const [filterSubnet, filterZone] = zoneFilter.split('|');
        const prefix = filterSubnet.replace(".0/24", "");
        matchZone = !!item.ip_address?.startsWith(prefix) && (item.network_zone === filterZone || (!item.network_zone && filterZone === "Unassigned"));
      }

      const matchDate = !dateFilter || (item.created_at && new Date(item.created_at).toISOString().split('T')[0] === dateFilter);
      const matchType = typeFilter === "All" || item.asset_type === typeFilter;
      return matchCriticality && matchCompany && matchZone && matchDate && matchType;
    });
  }, [assetsData, criticalityFilter, companyFilter, zoneFilter, dateFilter, typeFilter, companiesData]);

  const companiesList = ["All", ...companiesData.map(c => c.name)];
  const criticalities = ["All", "Critical", "High", "Medium", "Low", "Unassigned"];
  
  const dynamicSubnets = useMemo(() => {
    const map = new Map<string, string>();
    assetsData.forEach(item => {
      if (item.ip_address) {
        const parts = item.ip_address.split('.');
        if (parts.length === 4) {
          const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
          const subnet = `${prefix}.0/24`;
          const zone = item.network_zone || "Unassigned";
          const val = `${subnet}|${zone}`;
          const label = `${subnet} (${zone})`;
          map.set(val, label);
        }
      }
    });
    return Array.from(map.entries());
  }, [assetsData]);

  const assetTypes = ["All", "Server", "Workstation", "Network", "Mobile"];
  const zones = ["All", "Internal", "External", "DMZ", "Cloud", "Unassigned"];
  const environments = ["All", "Production", "Staging", "Development", "Testing", "Unassigned"];

  const engineOptions = [
    { value: "OPENVAS", label: "OpenVAS" },
    { value: "NMAP", label: "Nmap" },
    { value: "NUCLEI", label: "Nuclei" },
    { value: "NESSUS", label: "Nessus" }
  ];

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description={t("description")} 
        action={
          <div className="flex items-center gap-3">
            <div 
              className="relative" 
              tabIndex={0} 
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsEngineDropdownOpen(false);
                }
              }}
            >
              <button
                onClick={() => setIsEngineDropdownOpen(!isEngineDropdownOpen)}
                className="flex items-center justify-between px-3 py-2 bg-base border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[140px]"
              >
                <span className="truncate pr-2">
                  {engineOptions.find(o => o.value === vulnEngine)?.label || vulnEngine}
                </span>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isEngineDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isEngineDropdownOpen && (
                <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {engineOptions.map(o => (
                    <button
                      key={o.value}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors truncate ${vulnEngine === o.value ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                      onClick={() => {
                        setVulnEngine(o.value);
                        setIsEngineDropdownOpen(false);
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedAssetIds.size > 0 && (
              <button 
                onClick={() => handleScanAssets()} 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <ScanSearch className="w-4 h-4" />
                Scan Selected ({selectedAssetIds.size})
              </button>
            )}
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              {t("addAssetButton")}
            </button>
          </div>
        }
      />
      
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("companyLabel")}</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsCompanyDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[200px] w-[200px]"
            >
              <span className="truncate pr-2">
                {companyFilter === "All" ? t("allCompanies") : companyFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isCompanyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCompanyDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {companiesList.map(c => (
                  <button
                    key={c}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors truncate ${companyFilter === c ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setCompanyFilter(c);
                      setIsCompanyDropdownOpen(false);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("criticalityLabel")}</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsCriticalityDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsCriticalityDropdownOpen(!isCriticalityDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px] w-[160px]"
            >
              <span className="truncate pr-2">
                {criticalityFilter === "All" ? t("allCriticalities") : t(`crit${criticalityFilter}` as any)}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isCriticalityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCriticalityDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {criticalities.map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${criticalityFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setCriticalityFilter(opt);
                      setIsCriticalityDropdownOpen(false);
                    }}
                  >
                    {opt === "All" ? t("allCriticalities") : t(`crit${opt}` as any)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("networkZoneLabel")}</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsZoneDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px] w-[160px]"
            >
              <span className="truncate pr-2">
                {zoneFilter === "All" ? t("allZones") : dynamicSubnets.find(([v]) => v === zoneFilter)?.[1] || zoneFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isZoneDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isZoneDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${zoneFilter === "All" ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                  onClick={() => {
                    setZoneFilter("All");
                    setIsZoneDropdownOpen(false);
                  }}
                >
                  {t("allZones")}
                </button>
                {dynamicSubnets.map(([val, label]) => (
                  <button
                    key={val}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${zoneFilter === val ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setZoneFilter(val);
                      setIsZoneDropdownOpen(false);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("dateLabel")}</label>
          <DatePicker 
            value={dateFilter}
            onChange={(date) => setDateFilter(date)}
            placeholder="Select date"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">{t("assetTypeLabel")}</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsTypeDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px] w-[160px]"
            >
              <span className="truncate pr-2">
                {typeFilter === "All" ? t("allTypes") : typeFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {assetTypes.map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${typeFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setTypeFilter(opt);
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    {opt === "All" ? t("allTypes") : opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={filteredData} 
          keyField="id" 
          enableSelection={true}
          selectedIds={selectedAssetIds}
          onSelectionChange={setSelectedAssetIds}
          emptyMessage={t("noData")}
        />
      )}

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h3 className="font-semibold text-lg">Add New Asset</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAsset} className="p-5 flex flex-col gap-4">
              
              <div className="flex bg-base rounded-lg p-1">
                <button 
                  type="button" 
                  onClick={() => setAddMode("MANUAL")} 
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${addMode === "MANUAL" ? "bg-surface shadow text-primary" : "text-text-muted hover:text-text-main"}`}
                >
                  Manual Entry
                </button>
                <button 
                  type="button" 
                  onClick={() => setAddMode("DISCOVERY")} 
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${addMode === "DISCOVERY" ? "bg-surface shadow text-primary" : "text-text-muted hover:text-text-main"}`}
                >
                  Network Discovery
                </button>
              </div>

              {addMode === "MANUAL" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Hostname</label>
                    <input required value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. srv-01" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">IP Address</label>
                    <input required value={newAsset.ip_address} onChange={e => setNewAsset({...newAsset, ip_address: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="10.0.0.1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">MAC Address (Optional)</label>
                    <input value={newAsset.mac_address} onChange={e => setNewAsset({...newAsset, mac_address: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="00:1A:2B:3C:4D:5E" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Company</label>
                    <select value={newAsset.company_id} onChange={e => setNewAsset({...newAsset, company_id: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                      <option value="">Select a company</option>
                      {companiesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Network Zone</label>
                    <select value={newAsset.network_zone} onChange={e => setNewAsset({...newAsset, network_zone: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                      {zones.filter(z => z !== "All").map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Environment</label>
                    <select value={newAsset.environment} onChange={e => setNewAsset({...newAsset, environment: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                      {environments.filter(z => z !== "All").map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Asset Type</label>
                    <select value={newAsset.asset_type} onChange={e => setNewAsset({...newAsset, asset_type: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                      {assetTypes.filter(z => z !== "All").map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Criticality</label>
                    <select value={newAsset.criticality} onChange={e => setNewAsset({...newAsset, criticality: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                      {criticalities.filter(z => z !== "All").map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Target Subnet</label>
                    <input required value={discoverySubnet} onChange={e => setDiscoverySubnet(e.target.value)} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. 10.0.0.0/24" />
                    <p className="text-xs text-text-muted mt-1.5">We will perform a ping sweep on this subnet and automatically import discovered assets.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Assign to Network Zone</label>
                    <select value={discoveryZone} onChange={e => setDiscoveryZone(e.target.value)} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                      {zones.filter(z => z !== "All").map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Scanner Engine</label>
                    <div 
                      className="relative" 
                      tabIndex={0} 
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setIsDiscoveryEngineDropdownOpen(false);
                        }
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setIsDiscoveryEngineDropdownOpen(!isDiscoveryEngineDropdownOpen)}
                        className="flex items-center justify-between px-3 py-2 w-full bg-base border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
                      >
                        <span className="truncate pr-2">
                          {engineOptions.find(o => o.value === discoveryEngine)?.label || discoveryEngine}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isDiscoveryEngineDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDiscoveryEngineDropdownOpen && (
                        <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          {engineOptions.filter(o => ["OPENVAS", "NMAP"].includes(o.value)).map(o => (
                            <button
                              type="button"
                              key={o.value}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors truncate ${discoveryEngine === o.value ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                              onClick={() => {
                                setDiscoveryEngine(o.value);
                                setIsDiscoveryEngineDropdownOpen(false);
                              }}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-base rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
                  {addMode === "MANUAL" ? "Save Asset" : "Start Discovery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Asset Details Modal */}
      {isViewModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsViewModalOpen(false)}>
          <div className="bg-surface h-full w-full max-w-md shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-base/50">
              <h3 className="font-semibold text-xl">Asset Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-text-muted hover:text-white transition-colors bg-surface p-1.5 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xl uppercase">
                    {selectedAsset.name.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">{selectedAsset.name}</h4>
                    <p className="text-sm text-text-muted">{selectedAsset.ip_address}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">Company</p>
                    <p className="font-medium text-sm">
                      {selectedAsset.company_id ? companiesData.find(c => c.id === selectedAsset.company_id)?.name : "-"}
                    </p>
                  </div>
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">MAC Address</p>
                    <p className="font-medium text-sm">{selectedAsset.mac_address || "-"}</p>
                  </div>
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">OS</p>
                    <p className="font-medium text-sm">{selectedAsset.operating_system || "-"}</p>
                  </div>
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">Network Zone</p>
                    <p className="font-medium text-sm">{selectedAsset.network_zone || "-"}</p>
                  </div>
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">Environment</p>
                    <p className="font-medium text-sm">{selectedAsset.environment || "-"}</p>
                  </div>
                  <div className="bg-base p-3 rounded-lg border border-border/50 col-span-2">
                    <p className="text-xs text-text-muted mb-1">Open Ports</p>
                    <p className="font-medium text-sm break-all">{selectedAsset.ports || "None detected"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4 border-b border-border/50 pb-2">Active Vulnerabilities</h4>
                {assetVulnerabilities.length > 0 ? (
                  <div className="space-y-3">
                    {assetVulnerabilities.map(vuln => (
                      <div key={vuln.id} className="bg-base p-4 rounded-lg border border-border/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-4">
                          <h5 className="font-medium text-sm line-clamp-1" title={vuln.title}>{vuln.title}</h5>
                          <StatusBadge 
                            status={
                              vuln.severity === "Critical" ? "critical" :
                              vuln.severity === "High" ? "high" :
                              vuln.severity === "Medium" ? "medium" : "low"
                            } 
                            label={vuln.severity} 
                          />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          {vuln.cvss_base_score && <span>CVSS: <span className="font-medium text-text-main">{vuln.cvss_base_score}</span></span>}
                          {vuln.cve_id && <span>{vuln.cve_id}</span>}
                          <span className="bg-surface px-2 py-0.5 rounded text-[10px] uppercase font-medium">{vuln.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted italic">No vulnerabilities discovered on this asset.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4 border-b border-border/50 pb-2">History & Timeline</h4>
                {exposureData.length > 0 ? (
                  <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={exposureData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                        <XAxis 
                          dataKey="date" 
                          stroke="var(--text-muted)" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(val) => {
                            const d = new Date(val);
                            return `${d.getDate()}/${d.getMonth()+1}`;
                          }}
                        />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
                          labelStyle={{ color: 'var(--text-muted)' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="var(--primary)" 
                          fillOpacity={1} 
                          fill="url(#colorCount)" 
                          strokeWidth={2}
                          name="Vulnerabilities Discovered"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="relative border-l border-border/50 ml-3 space-y-6">
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1 ring-4 ring-surface"></div>
                      <p className="text-sm font-medium text-white mb-0.5">Asset Created</p>
                      <p className="text-xs text-text-muted">{new Date(selectedAsset.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Raw Scan Output Section */}
              {selectedAsset.last_scan_raw_output && (
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4 border-b border-border/50 pb-2 mt-8">Raw Scan Output (Latest)</h4>
                  <div className="bg-[#1e1e1e] rounded-lg border border-border/50 overflow-hidden">
                    <pre className="p-4 text-xs font-mono text-[#d4d4d4] overflow-x-auto overflow-y-auto max-h-96 whitespace-pre-wrap">
                      {selectedAsset.last_scan_raw_output}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-border/50 bg-base/50">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full py-2.5 bg-surface hover:bg-surface-hover border border-border text-white rounded-lg text-sm font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {isEditModalOpen && editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h3 className="font-semibold text-lg">Edit Asset</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditAsset} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Hostname</label>
                  <input required value={editingAsset.name} onChange={e => setEditingAsset({...editingAsset, name: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">IP Address</label>
                  <input required value={editingAsset.ip_address} onChange={e => setEditingAsset({...editingAsset, ip_address: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">MAC Address (Optional)</label>
                  <input value={editingAsset.mac_address || ""} onChange={e => setEditingAsset({...editingAsset, mac_address: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Company</label>
                  <select value={editingAsset.company_id || ""} onChange={e => setEditingAsset({...editingAsset, company_id: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="">Select a company</option>
                    {companiesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Network Zone</label>
                  <select value={editingAsset.network_zone || ""} onChange={e => setEditingAsset({...editingAsset, network_zone: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    {zones.filter(z => z !== "All").map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Environment</label>
                  <select value={editingAsset.environment || ""} onChange={e => setEditingAsset({...editingAsset, environment: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    {environments.filter(z => z !== "All").map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Asset Type</label>
                  <select value={editingAsset.asset_type || ""} onChange={e => setEditingAsset({...editingAsset, asset_type: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    {assetTypes.filter(z => z !== "All").map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Criticality</label>
                  <select value={editingAsset.criticality || "Unassigned"} onChange={e => setEditingAsset({...editingAsset, criticality: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    {criticalities.filter(z => z !== "All").map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-base rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
