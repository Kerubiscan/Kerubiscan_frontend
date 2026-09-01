"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { UserPlus, ShieldPlus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";

export default function AdminUsersPage() {
  const t = useTranslations("AdminUsers");
  const [users, setUsers] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { data: session } = useSession();

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

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.accessToken) return;
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          ...data,
          enabled: true,
        })
      });
      if (res.ok) {
        setIsAddOpen(false);
        setRefresh(r => r + 1);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to create user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.accessToken || !selectedUserId) return;

    const formData = new FormData(e.currentTarget);
    const role_name = formData.get("role_name");

    try {
      const res = await fetch(`/api/v1/admin/users/${selectedUserId}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ role_name })
      });
      if (res.ok) {
        setIsRoleOpen(false);
        setRefresh(r => r + 1);
      } else {
        const errData = await res.json();
        alert(errData.detail || "Failed to assign role");
      }
    } catch (err) {
      console.error(err);
    }
  };

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
      header: t("actions"),
      accessor: (row: any) => (
        <button 
          onClick={() => { setSelectedUserId(row.id); setIsRoleOpen(true); }}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover transition-colors"
        >
          <ShieldPlus className="w-4 h-4" />
          {t("editRoles")}
        </button>
      )
    }
  ];

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description="Manage system users and access roles across the platform"
        action={
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {t("createUser")}
          </button>
        }
      />

      <DataTable 
        columns={columns} 
        data={users} 
        keyField="id" 
      />

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{t("createNewUser")}</h2>
              <button onClick={() => setIsAddOpen(false)} className="text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">{t("username")}</label>
                <input required name="username" type="text" className="w-full bg-base border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">{t("email")}</label>
                <input required name="email" type="email" className="w-full bg-base border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">{t("password")}</label>
                <input required name="password" type="password" className="w-full bg-base border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">{t("firstName")}</label>
                  <input required name="first_name" type="text" className="w-full bg-base border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">{t("lastName")}</label>
                  <input required name="last_name" type="text" className="w-full bg-base border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">{t("initialRole")}</label>
                <select name="role" className="w-full bg-base border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors appearance-none">
                  <option value="">{t("none")}</option>
                  <option value="Platform Administrator">Platform Administrator</option>
                  <option value="Security Analyst">Security Analyst</option>
                  <option value="System Administrator">System Administrator</option>
                  <option value="Reader">Reader</option>
                </select>
              </div>
              <div className="pt-4 mt-2 flex justify-end gap-3 border-t border-border/50">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-white transition-colors hover:bg-base rounded-lg">{t("cancel")}</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">{t("createUser")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRoleOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{t("assignRole")}</h2>
              <button onClick={() => setIsRoleOpen(false)} className="text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleAssignRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">{t("selectRole")}</label>
                <select name="role_name" className="w-full bg-base border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors appearance-none">
                  <option value="Platform Administrator">Platform Administrator</option>
                  <option value="Security Analyst">Security Analyst</option>
                  <option value="System Administrator">System Administrator</option>
                  <option value="Reader">Reader</option>
                </select>
              </div>
              <div className="pt-4 mt-2 flex justify-end gap-3 border-t border-border/50">
                <button type="button" onClick={() => setIsRoleOpen(false)} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-white transition-colors hover:bg-base rounded-lg">{t("cancel")}</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">{t("assignRole")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
