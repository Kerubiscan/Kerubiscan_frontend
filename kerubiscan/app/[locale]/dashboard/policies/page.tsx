"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { ShieldPlus, ChevronDown, Eye, X, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function PoliciesPage() {
  const t = useTranslations("Pages.policies");
  
  const [companyFilter, setCompanyFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);

  const [policiesData, setPoliciesData] = useState<any[]>([]);
  const [companiesData, setCompaniesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ 
    name: "", 
    scan_type: "Full and fast", 
    company_id: "",
    port_scanning_range: "1-65535",
    safe_checks: true,
    concurrent_hosts: 20,
    concurrent_checks: 10
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [polRes, compRes] = await Promise.all([
        fetchApi<any>("/policies?size=500"),
        fetchApi<any[]>("/scans/companies")
      ]);
      setPoliciesData(polRes.items || []);
      setCompaniesData(compRes || []);
    } catch (err) {
      console.error("Failed to load policies data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi("/policies", {
        method: "POST",
        body: JSON.stringify({
          name: newPolicy.name,
          scan_type: newPolicy.scan_type,
          author: "Current User",
          company_id: newPolicy.company_id ? parseInt(newPolicy.company_id) : null,
          port_scanning_range: newPolicy.port_scanning_range,
          safe_checks: newPolicy.safe_checks,
          concurrent_hosts: parseInt(newPolicy.concurrent_hosts as any),
          concurrent_checks: parseInt(newPolicy.concurrent_checks as any)
        })
      });
      setIsAddModalOpen(false);
      setNewPolicy({ 
        name: "", 
        scan_type: "Full and fast", 
        company_id: "",
        port_scanning_range: "1-65535",
        safe_checks: true,
        concurrent_hosts: 20,
        concurrent_checks: 10
      });
      loadData();
    } catch (err) {
      console.error("Failed to create policy", err);
      alert("Failed to create policy");
    }
  };

  const getCompanyName = (id: number) => {
    if (!id) return "-";
    const c = companiesData.find(c => c.id === id);
    return c ? c.name : `Company ${id}`;
  };

  const columns = [
    { header: "Policy Name", accessor: "name" as const, className: "font-medium" },
    { header: "Scan Type", accessor: "scan_type" as const },
    { 
      header: "Company", 
      accessor: (row: any) => getCompanyName(row.company_id), 
      className: "text-text-muted" 
    },
    { 
      header: "Last Updated", 
      accessor: (row: any) => new Date(row.updated_at).toLocaleDateString(), 
      className: "text-text-muted" 
    },
    { header: "Author", accessor: "author" as const, className: "text-text-muted" },
    {
      header: "Actions",
      accessor: (row: any) => (
        <button 
          onClick={(e) => { e.stopPropagation(); setSelectedPolicy(row); setIsViewModalOpen(true); }}
          className="p-1 text-text-muted hover:text-primary transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  const filteredData = useMemo(() => {
    return policiesData.filter(item => {
      const compName = getCompanyName(item.company_id);
      const matchCompany = companyFilter === "All" || compName === companyFilter;
      const matchType = typeFilter === "All" || item.scan_type === typeFilter;
      return matchCompany && matchType;
    });
  }, [companyFilter, typeFilter, policiesData, companiesData]);

  const companiesList = ["All", ...companiesData.map(c => c.name)];
  const types = ["All", "Full and fast", "Web App", "Compliance", "Network Discovery"];

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description={t("description")} 
        action={
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
            <ShieldPlus className="w-4 h-4" />
            Create Policy
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Company:</label>
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
                {companyFilter === "All" ? "All Companies" : companyFilter}
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
          <label className="text-sm text-text-muted font-medium">Scan Type:</label>
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
                {typeFilter === "All" ? "All Types" : typeFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {types.map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${typeFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setTypeFilter(opt);
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    {opt}
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
        />
      )}

      {/* Add Policy Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h3 className="font-semibold text-lg">Create New Policy</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPolicy} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Policy Name</label>
                <input required value={newPolicy.name} onChange={e => setNewPolicy({...newPolicy, name: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. Default Full Scan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Scan Type</label>
                  <select value={newPolicy.scan_type} onChange={e => setNewPolicy({...newPolicy, scan_type: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="Full and fast">Full and fast</option>
                    <option value="Web App">Web App</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Network Discovery">Network Discovery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Company</label>
                  <select required value={newPolicy.company_id} onChange={e => setNewPolicy({...newPolicy, company_id: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="">Select a company</option>
                    {companiesData.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border/50 pb-2">Policy Configuration</h4>
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Port Scanning Range</label>
                    <input required value={newPolicy.port_scanning_range} onChange={e => setNewPolicy({...newPolicy, port_scanning_range: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. 1-65535" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer py-2">
                      <input type="checkbox" checked={newPolicy.safe_checks} onChange={e => setNewPolicy({...newPolicy, safe_checks: e.target.checked})} className="rounded bg-base border-border text-primary focus:ring-primary h-4 w-4" />
                      <span className="text-sm font-medium text-text-muted">Safe Checks Enabled</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Concurrent Hosts</label>
                    <input type="number" required min="1" value={newPolicy.concurrent_hosts} onChange={e => setNewPolicy({...newPolicy, concurrent_hosts: parseInt(e.target.value) || 20})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Concurrent Checks per Host</label>
                    <input type="number" required min="1" value={newPolicy.concurrent_checks} onChange={e => setNewPolicy({...newPolicy, concurrent_checks: parseInt(e.target.value) || 10})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-base rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <ShieldPlus className="w-4 h-4" /> Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Policy Details Modal */}
      {isViewModalOpen && selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsViewModalOpen(false)}>
          <div className="bg-surface h-full w-full max-w-md shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-base/50">
              <h3 className="font-semibold text-xl">Policy Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-text-muted hover:text-white transition-colors bg-surface p-1.5 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <h4 className="text-2xl font-bold">{selectedPolicy.name}</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-base p-3 rounded-lg border border-border/50">
                  <p className="text-xs text-text-muted mb-1">Scan Type</p>
                  <p className="font-medium text-sm">{selectedPolicy.scan_type}</p>
                </div>
                <div className="bg-base p-3 rounded-lg border border-border/50">
                  <p className="text-xs text-text-muted mb-1">Company</p>
                  <p className="font-medium text-sm">{getCompanyName(selectedPolicy.company_id)}</p>
                </div>
                <div className="bg-base p-3 rounded-lg border border-border/50">
                  <p className="text-xs text-text-muted mb-1">Author</p>
                  <p className="font-medium text-sm">{selectedPolicy.author || "-"}</p>
                </div>
                <div className="bg-base p-3 rounded-lg border border-border/50">
                  <p className="text-xs text-text-muted mb-1">Last Updated</p>
                  <p className="font-medium text-sm">{new Date(selectedPolicy.updated_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border/50 pb-2">Policy Configuration</h4>
                <div className="space-y-3 mt-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">Port Scanning Range</span>
                    <span className="font-medium">{selectedPolicy.port_scanning_range || "1-65535"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">Safe Checks Enabled</span>
                    <span className={`font-medium ${selectedPolicy.safe_checks !== false ? 'text-status-success' : 'text-status-error'}`}>
                      {selectedPolicy.safe_checks !== false ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">Concurrent Hosts</span>
                    <span className="font-medium">{selectedPolicy.concurrent_hosts || 20}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">Concurrent Checks per Host</span>
                    <span className="font-medium">{selectedPolicy.concurrent_checks || 10}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-border/50 bg-base/50">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full py-2.5 bg-surface hover:bg-surface-hover border border-border text-white rounded-lg text-sm font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
