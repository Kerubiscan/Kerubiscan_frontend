"use client";

import React, { useEffect, useState } from "react";
import { XCircle, AlertTriangle, Shield, Info, Calendar, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { fetchApi } from "@/lib/api";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");

  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [pieData, setPieData] = useState<any[]>([]);
  const [lineData, setLineData] = useState<any[]>([]);
  const [osData, setOsData] = useState<any[]>([]);
  const [latestScan, setLatestScan] = useState<any>(null);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [scheduledScans, setScheduledScans] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        const [
          kpisData,
          pieChartData,
          lineChartData,
          osChartData,
          latestScanData,
          recentVulnsData,
          scheduledScansData
        ] = await Promise.all([
          fetchApi<any>("/dashboard/kpis"),
          fetchApi<any[]>("/dashboard/charts/distribution"),
          fetchApi<any[]>("/dashboard/charts/over-time"),
          fetchApi<any[]>("/dashboard/assets-os"),
          fetchApi<any>("/dashboard/latest-scan"),
          fetchApi<any[]>("/dashboard/recent-vulnerabilities"),
          fetchApi<any[]>("/dashboard/scheduled-scans")
        ]);

        setKpis(kpisData);
        setPieData(pieChartData);
        setLineData(lineChartData);
        setOsData(osChartData);
        setLatestScan(latestScanData);
        setVulnerabilities(recentVulnsData);
        setScheduledScans(scheduledScansData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const formatLabel = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  if (isLoading || !kpis) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate total vulnerabilities for pie chart percentage
  const totalVulns = pieData.reduce((acc, curr) => acc + curr.value, 0) || 1;

  return (
    <div className="flex flex-col gap-6 pb-6">

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-status-critical font-medium mb-2 uppercase text-sm">{t("stats.critical")}</h3>
              <p className="text-4xl font-bold text-status-critical mb-2">{kpis.critical}</p>
              <p className="text-text-muted text-xs">{t("stats.criticalSub")}</p>
            </div>
            <div className="text-status-critical">
              <XCircle className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-status-high font-medium mb-2 uppercase text-sm">{t("stats.high")}</h3>
              <p className="text-4xl font-bold text-status-high mb-2">{kpis.high}</p>
              <p className="text-text-muted text-xs">{t("stats.highSub")}</p>
            </div>
            <div className="text-status-high">
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-status-medium font-medium mb-2 uppercase text-sm">{t("stats.medium")}</h3>
              <p className="text-4xl font-bold text-status-medium mb-2">{kpis.medium}</p>
              <p className="text-text-muted text-xs">{t("stats.mediumSub")}</p>
            </div>
            <div className="text-status-medium">
              <Shield className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-status-low font-medium mb-2 uppercase text-sm">{t("stats.low")}</h3>
              <p className="text-4xl font-bold text-status-low mb-2">{kpis.low}</p>
              <p className="text-text-muted text-xs">{t("stats.lowSub")}</p>
            </div>
            <div className="text-status-low">
              <Shield className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-status-info font-medium mb-2 uppercase text-sm">{t("stats.info")}</h3>
              <p className="text-4xl font-bold text-status-info mb-2">{kpis.info}</p>
              <p className="text-text-muted text-xs">{t("stats.infoSub")}</p>
            </div>
            <div className="text-status-info">
              <Info className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Charts + (Latest Scan & Assets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col">
            <h3 className="text-sm font-semibold mb-4 uppercase">{t("charts.distribution")}</h3>
            <div className="flex-1 flex flex-col justify-center min-h-[200px]">
              <div className="w-full h-56 mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
                      stroke="none"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
                      itemStyle={{ color: 'var(--text-main)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[85%] mx-auto space-y-1.5 mt-1">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                      <span className="text-text-muted">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{item.value}</span>
                      <span className="text-text-muted text-xs">({Math.round(item.value / totalVulns * 100)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold uppercase">{t("charts.overTime")}</h3>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] mb-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-1 bg-status-critical"></div><span className="text-text-muted">{formatLabel(t("stats.critical"))}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-1 bg-status-high"></div><span className="text-text-muted">{formatLabel(t("stats.high"))}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-1 bg-status-medium"></div><span className="text-text-muted">{formatLabel(t("stats.medium"))}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-1 bg-status-low"></div><span className="text-text-muted">{formatLabel(t("stats.low"))}</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-1 bg-status-info"></div><span className="text-text-muted">{formatLabel(t("stats.info"))}</span></div>
            </div>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
                  />
                  <Line type="monotone" dataKey="Critical" stroke="var(--status-critical)" strokeWidth={2} dot={{ r: 2, fill: 'var(--status-critical)', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="High" stroke="var(--status-high)" strokeWidth={2} dot={{ r: 2, fill: 'var(--status-high)', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="Medium" stroke="var(--status-medium)" strokeWidth={2} dot={{ r: 2, fill: 'var(--status-medium)', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="Low" stroke="var(--status-low)" strokeWidth={2} dot={{ r: 2, fill: 'var(--status-low)', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="Info" stroke="var(--status-info)" strokeWidth={2} dot={{ r: 2, fill: 'var(--status-info)', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-xl p-5 flex-1 flex flex-col justify-center">
            <h3 className="text-sm font-semibold mb-6 uppercase">{t("latestScan.title")}</h3>
            <div className="space-y-4 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-text-muted">{t("latestScan.name")}</span>
                <span className="font-medium text-right">{latestScan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{t("latestScan.target")}</span>
                <span className="font-medium text-right">{latestScan?.target}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{t("latestScan.date")}</span>
                <span className="font-medium text-right">{latestScan?.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">{t("latestScan.status")}</span>
                <span className="px-2 py-0.5 bg-status-info/20 text-status-info rounded-md text-xs font-medium border border-status-info/30">{latestScan?.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{t("latestScan.vulnerabilities")}</span>
                <span className="font-medium text-right">{latestScan?.vulnerabilities}</span>
              </div>
            </div>
            <Link href="/dashboard/reports" className="w-full py-2 bg-transparent border border-primary/30 text-primary hover:bg-primary/10 rounded-lg text-sm transition-colors font-medium mt-auto text-center block">
              {t("latestScan.viewReport")}
            </Link>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 flex-1 flex flex-col justify-center">
            <h3 className="text-sm font-semibold mb-6 uppercase">{t("assets.title")}</h3>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {osData.map((os, i) => (
                <div key={i} className="flex items-center text-sm">
                  <div className="w-20 text-text-muted truncate" title={os.name}>{os.name}</div>
                  <div className="flex-1 px-3">
                    <div className="h-1.5 w-full bg-base rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: os.percentage, backgroundColor: os.color }}></div>
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="font-medium">{os.count}</span> <span className="text-text-muted text-xs">({os.percentage})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Table + Scheduled Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-semibold mb-6 uppercase">{t("vulnerabilities.title")}</h3>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted uppercase border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("vulnerabilities.severity")}</th>
                  <th className="px-4 py-3 font-medium">{t("vulnerabilities.name")}</th>
                  <th className="px-4 py-3 font-medium">{t("vulnerabilities.target")}</th>
                  <th className="px-4 py-3 font-medium">{t("vulnerabilities.service")}</th>
                  <th className="px-4 py-3 font-medium">{t("vulnerabilities.port")}</th>
                  <th className="px-4 py-3 font-medium">{t("vulnerabilities.detectedOn")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {vulnerabilities.map((vuln, i) => (
                  <tr key={i} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${vuln.badgeClass}`}>
                        {vuln.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[150px] truncate" title={vuln.name}>{vuln.name}</td>
                    <td className="px-4 py-3 text-text-muted">{vuln.target}</td>
                    <td className="px-4 py-3 text-text-muted">{vuln.service}</td>
                    <td className="px-4 py-3 text-text-muted">{vuln.port}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{vuln.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <Link href="/dashboard/vulnerabilities" className="w-full py-2 bg-transparent border border-primary/30 text-primary hover:bg-primary/10 rounded-lg text-sm transition-colors font-medium block text-center">
              {t("vulnerabilities.viewAll")}
            </Link>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-semibold mb-6 uppercase">{t("scheduledScans.title")}</h3>
          <div className="flex-1 space-y-6 mb-6">
            {scheduledScans.map((scan, i) => (
              <div key={i} className="flex gap-4">
                <div className="text-text-muted pt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">{scan.name}</h4>
                  <p className="text-xs text-text-muted mt-1">{scan.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-border/50">
            <Link href="/dashboard/scheduling" className="w-full py-2 bg-transparent border border-primary/30 text-primary hover:bg-primary/10 rounded-lg text-sm transition-colors font-medium block text-center">
              {t("scheduledScans.manage")}
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
