"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CalendarPlus, ChevronDown, X, Eye, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function SchedulingPage() {
  const t = useTranslations("Pages.scheduling");
  
  const [companyFilter, setCompanyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [frequencyFilter, setFrequencyFilter] = useState("All");
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isFrequencyDropdownOpen, setIsFrequencyDropdownOpen] = useState(false);

  const [schedulesData, setSchedulesData] = useState<any[]>([]);
  const [companiesData, setCompaniesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ 
    name: "", 
    target: "", 
    frequency: "Daily", 
    company_id: "",
    time: "00:00",
    dayOfWeek: "Monday",
    dayOfMonth: "1",
    scan_type: "VULNERABILITY",
    network_zone: "",
    scanner_engine: "OPENVAS"
  });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [schedRes, compRes] = await Promise.all([
        fetchApi<any>("/scheduling?size=500"),
        fetchApi<any[]>("/scans/companies")
      ]);
      setSchedulesData(schedRes.items || []);
      setCompaniesData(compRes || []);
    } catch (err) {
      console.error("Failed to load scheduling data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let frequencyText = "";
    if (newSchedule.frequency === "Daily") {
      frequencyText = `Daily at ${newSchedule.time}`;
    } else if (newSchedule.frequency === "Weekly") {
      frequencyText = `${newSchedule.dayOfWeek}s at ${newSchedule.time}`;
    } else if (newSchedule.frequency === "Monthly") {
      frequencyText = `${newSchedule.dayOfMonth} of Month at ${newSchedule.time}`;
    }

    let nextRunText = "";
    if (newSchedule.frequency === "Daily") {
      const now = new Date();
      const [hours, minutes] = newSchedule.time.split(':').map(Number);
      if (hours > now.getHours() || (hours === now.getHours() && minutes > now.getMinutes())) {
        nextRunText = `Today, ${newSchedule.time}`;
      } else {
        nextRunText = `Tomorrow, ${newSchedule.time}`;
      }
    } else if (newSchedule.frequency === "Weekly") {
      nextRunText = `Next ${newSchedule.dayOfWeek}, ${newSchedule.time}`;
    } else if (newSchedule.frequency === "Monthly") {
      nextRunText = `${newSchedule.dayOfMonth}th of next month, ${newSchedule.time}`;
    }

    try {
      await fetchApi("/scheduling", {
        method: "POST",
        body: JSON.stringify({
          name: newSchedule.name,
          target: newSchedule.target,
          frequency: frequencyText,
          next_run: nextRunText,
          status: "Active",
          company_id: newSchedule.company_id ? parseInt(newSchedule.company_id) : null,
          scan_type: newSchedule.scan_type,
          network_zone: newSchedule.network_zone || null,
          scanner_engine: newSchedule.scanner_engine
        })
      });
      setIsAddModalOpen(false);
      setNewSchedule({ name: "", target: "", frequency: "Daily", company_id: "", time: "00:00", dayOfWeek: "Monday", dayOfMonth: "1", scan_type: "VULNERABILITY", network_zone: "", scanner_engine: "OPENVAS" });
      loadData();
    } catch (err) {
      console.error("Failed to create schedule", err);
      alert("Failed to create schedule");
    }
  };

  const getCompanyName = (id: number) => {
    if (!id) return "-";
    const c = companiesData.find(c => c.id === id);
    return c ? c.name : `Company ${id}`;
  };

  const columns = [
    { header: "Schedule Name", accessor: "name" as const, className: "font-medium" },
    { header: "Target", accessor: "target" as const },
    { 
      header: "Company", 
      accessor: (row: any) => getCompanyName(row.company_id), 
      className: "text-text-muted" 
    },
    { header: "Frequency", accessor: "frequency" as const, className: "text-text-muted" },
    { header: "Next Run", accessor: "next_run" as const },
    { 
      header: "Status", 
      accessor: (row: any) => (
        <StatusBadge 
          status={row.status === "Active" ? "success" : "warning"} 
          label={row.status || "Unknown"} 
        />
      )
    },
    {
      header: "Actions",
      accessor: (row: any) => (
        <button 
          onClick={(e) => { e.stopPropagation(); setSelectedSchedule(row); setIsViewModalOpen(true); }}
          className="p-1 text-text-muted hover:text-primary transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  const filteredData = useMemo(() => {
    return schedulesData.filter(item => {
      const compName = getCompanyName(item.company_id);
      
      const matchCompany = companyFilter === "All" || compName === companyFilter;
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      
      let type = "Daily";
      if (item.frequency.includes("s at")) type = "Weekly";
      if (item.frequency.includes("Month")) type = "Monthly";

      const matchFreq = frequencyFilter === "All" || type === frequencyFilter;
      return matchCompany && matchStatus && matchFreq;
    });
  }, [companyFilter, statusFilter, frequencyFilter, schedulesData, companiesData]);

  const companiesList = ["All", ...companiesData.map(c => c.name)];
  const statuses = ["All", "Active", "Paused", "Disabled"];
  const frequencies = ["All", "Daily", "Weekly", "Monthly"];

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description={t("description")} 
        action={
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
            <CalendarPlus className="w-4 h-4" />
            New Schedule
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
          <label className="text-sm text-text-muted font-medium">Status:</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsStatusDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px] w-[160px]"
            >
              <span className="truncate pr-2">
                {statusFilter === "All" ? "All Statuses" : statusFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {statuses.map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${statusFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setStatusFilter(opt);
                      setIsStatusDropdownOpen(false);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-text-muted font-medium">Frequency:</label>
          <div 
            className="relative" 
            tabIndex={0} 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsFrequencyDropdownOpen(false);
              }
            }}
          >
            <button
              onClick={() => setIsFrequencyDropdownOpen(!isFrequencyDropdownOpen)}
              className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[160px] w-[160px]"
            >
              <span className="truncate pr-2">
                {frequencyFilter === "All" ? "All Frequencies" : frequencyFilter}
              </span>
              <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isFrequencyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFrequencyDropdownOpen && (
              <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-y-auto max-h-60 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {frequencies.map(opt => (
                  <button
                    key={opt}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${frequencyFilter === opt ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                    onClick={() => {
                      setFrequencyFilter(opt);
                      setIsFrequencyDropdownOpen(false);
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

      {/* Add Schedule Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h3 className="font-semibold text-lg">Create New Schedule</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSchedule} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Schedule Name</label>
                <input required value={newSchedule.name} onChange={e => setNewSchedule({...newSchedule, name: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. Weekly Production Scan" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Scan Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${newSchedule.scan_type === "DISCOVERY" ? "bg-primary/10 border-primary text-primary" : "bg-base border-border text-text-muted hover:border-primary/50"}`}
                    onClick={() => setNewSchedule({...newSchedule, scan_type: "DISCOVERY"})}
                  >
                    Network Discovery
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${newSchedule.scan_type === "VULNERABILITY" ? "bg-primary/10 border-primary text-primary" : "bg-base border-border text-text-muted hover:border-primary/50"}`}
                    onClick={() => setNewSchedule({...newSchedule, scan_type: "VULNERABILITY"})}
                  >
                    Vulnerability Scan
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Target</label>
                <input required value={newSchedule.target} onChange={e => setNewSchedule({...newSchedule, target: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder={newSchedule.scan_type === "DISCOVERY" ? "10.0.0.0/24" : "192.168.1.10 or 10.0.0.0/24"} />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Network Zone</label>
                <input value={newSchedule.network_zone} onChange={e => setNewSchedule({...newSchedule, network_zone: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="Custom Zone (e.g. Main Office)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Frequency</label>
                  <select value={newSchedule.frequency} onChange={e => setNewSchedule({...newSchedule, frequency: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                
                {newSchedule.frequency === "Weekly" && (
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Day of Week</label>
                    <select value={newSchedule.dayOfWeek} onChange={e => setNewSchedule({...newSchedule, dayOfWeek: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                )}

                {newSchedule.frequency === "Monthly" && (
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Day of Month</label>
                    <select value={newSchedule.dayOfMonth} onChange={e => setNewSchedule({...newSchedule, dayOfMonth: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                      {[...Array(31)].map((_, i) => (
                        <option key={i+1} value={(i+1).toString()}>{i+1}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Time</label>
                  <input type="time" required value={newSchedule.time} onChange={e => setNewSchedule({...newSchedule, time: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Company</label>
                  <select required value={newSchedule.company_id} onChange={e => setNewSchedule({...newSchedule, company_id: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="">Select a company</option>
                    {companiesData.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Scanner Engine</label>
                  <select value={newSchedule.scanner_engine} onChange={e => setNewSchedule({...newSchedule, scanner_engine: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="OPENVAS">OpenVAS</option>
                    <option value="NMAP">Nmap</option>
                    <option value="NUCLEI">Nuclei</option>
                    <option value="NESSUS">Nessus</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-base rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4" /> Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Schedule Details Modal */}
      {isViewModalOpen && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsViewModalOpen(false)}>
          <div className="bg-surface h-full w-full max-w-md shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-base/50">
              <h3 className="font-semibold text-xl">Schedule Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-text-muted hover:text-white transition-colors bg-surface p-1.5 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-bold">{selectedSchedule.name}</h4>
                  <StatusBadge status={selectedSchedule.status === "Active" ? "success" : "warning"} label={selectedSchedule.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">Target</p>
                    <p className="font-medium text-sm">{selectedSchedule.target}</p>
                  </div>
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">Network Zone</p>
                    <p className="font-medium text-sm">{selectedSchedule.network_zone || "N/A"}</p>
                  </div>
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">Company</p>
                    <p className="font-medium text-sm">{getCompanyName(selectedSchedule.company_id)}</p>
                  </div>
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">Scan Type</p>
                    <p className="font-medium text-sm">{selectedSchedule.scan_type}</p>
                  </div>
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">Scanner Engine</p>
                    <p className="font-medium text-sm">{selectedSchedule.scanner_engine}</p>
                  </div>
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">Frequency</p>
                    <p className="font-medium text-sm">{selectedSchedule.frequency}</p>
                  </div>
                  <div className="bg-base p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-text-muted mb-1">Next Run</p>
                    <p className="font-medium text-sm">{selectedSchedule.next_run}</p>
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
