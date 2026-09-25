"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { UserPlus, Shield, ExternalLink, RefreshCw, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";

export default function AdminUsersPage() {
  const t = useTranslations("AdminUsers");
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [isRoleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { data: session } = useSession();

  const getKeycloakBaseUrl = () => {
    if (typeof window !== "undefined") {
      if (process.env.NEXT_PUBLIC_KEYCLOAK_URL) {
        return process.env.NEXT_PUBLIC_KEYCLOAK_URL.replace(/\/$/, "");
      }
      return `${window.location.protocol}//${window.location.hostname}:1990`;
    }
    return process.env.KEYCLOAK_PUBLIC_URL || process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:1990";
  };

  const keycloakBaseUrl = getKeycloakBaseUrl();

  useEffect(() => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    fetch("/api/v1/admin/users", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
        else setUsers([]);
      })
      .catch(err => {
        console.error(err);
        setUsers([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [session, refresh]);

  const columns = [
    { header: t("username"), accessor: "username" as const, className: "font-medium" },
    { header: t("email"), accessor: "email" as const, className: "text-text-muted" },
    { 
      header: t("status"), 
      accessor: (row: any) => (
        <span className={`px-2 py-1 rounded-md text-xs font-bold ${row.enabled ? 'bg-status-info/10 text-status-info border border-status-info/20' : 'bg-status-critical/10 text-status-critical border border-status-critical/20'}`}>
          {row.enabled ? "Active" : "Disabled"}
        </span>
      )
    },
    {
      header: "Role",
      accessor: (row: any) => {
        const roles = row.realmRoles || row.roles || [];
        if (roles.length > 0) {
          return (
            <div className="flex gap-1 flex-wrap">
              {roles.filter((r: string) => r !== "default-roles-kimia" && r !== "offline_access" && r !== "uma_authorization").map((r: string) => (
                <span key={r} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                  {r}
                </span>
              ))}
            </div>
          );
        }
        return <span className="text-text-muted text-xs">User</span>;
      }
    },
    {
      header: t("actions"),
      accessor: (row: any) => (
        <a 
          href={`${keycloakBaseUrl}/admin/kimia/console/#/kimia/users/${row.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:text-white hover:bg-primary/20 rounded-md transition-colors border border-primary/30"
          title="Open user in Keycloak Admin Console"
        >
          <Shield className="w-3.5 h-3.5" />
          Manage in Keycloak
          <ExternalLink className="w-3 h-3 opacity-70" />
        </a>
      )
    }
  ];

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description="Manage system users, credentials, and access roles centrally via Keycloak"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRefresh(r => r + 1)}
              className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-hover border border-border text-text-muted hover:text-white rounded-lg text-sm font-medium transition-colors"
              title="Refresh users list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <a 
              href={`${keycloakBaseUrl}/admin/kimia/console/#/kimia/users/add-user`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              {t("createUser")} in Keycloak
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        }
      />

      {/* Information Banner */}
      <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Centralized Keycloak Identity Management</h4>
            <p className="text-xs text-text-muted mt-0.5">
              All user accounts, password resets, role mappings, and authentication policies are centrally governed in Keycloak. Click any action to manage users directly in the Keycloak Console.
            </p>
          </div>
        </div>
        <a
          href={`${keycloakBaseUrl}/admin/kimia/console/#/kimia/users`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors whitespace-nowrap shadow-sm"
        >
          Open Keycloak Users
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm text-text-muted font-medium">Filter by Role:</label>
        <div 
          className="relative" 
          tabIndex={0} 
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setRoleDropdownOpen(false);
          }}
        >
          <button
            onClick={() => setRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-primary transition-colors min-w-[200px]"
          >
            <span className="truncate pr-2">
              {roleFilter === "All" ? "All Roles" : roleFilter === "admin" ? "Platform Administrator" : "Security Analyst"}
            </span>
            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute z-10 top-full left-0 mt-2 w-full bg-surface border border-border rounded-lg shadow-lg overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
              {[
                { id: "All", label: "All Roles" },
                { id: "admin", label: "Platform Administrator" },
                { id: "user", label: "Security Analyst" }
              ].map(r => (
                <button
                  key={r.id}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-base transition-colors ${roleFilter === r.id ? "bg-primary/10 text-primary font-medium" : "text-text-main"}`}
                  onClick={() => {
                    setRoleFilter(r.id);
                    setRoleDropdownOpen(false);
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={roleFilter === "All" ? users : users.filter(u => {
           const roles = u.realmRoles || u.roles || [];
           if (roleFilter === "admin") return roles.includes("admin") || roles.includes("Administrator");
           return !roles.includes("admin") && !roles.includes("Administrator");
        })} 
        keyField="id" 
      />
    </div>
  );
}
