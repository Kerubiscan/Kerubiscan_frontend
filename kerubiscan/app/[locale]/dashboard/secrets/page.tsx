"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Plus, X, Lock, Trash2, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function SecretsPage() {
  const t = useTranslations("Pages.secrets");
  
  const [secrets, setSecrets] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSecret, setNewSecret] = useState({ 
    name: "", 
    type: "ssh", 
    username: "", 
    secretValue: "",
    asset_id: "",
    dbName: "",
    port: "5432",
    awsAccessKeyId: ""
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [secRes, astRes] = await Promise.all([
        fetchApi<any>("/secrets?size=500"),
        fetchApi<any>("/assets?size=500")
      ]);
      setSecrets(secRes.items || []);
      setAssets(astRes.items || []);
    } catch (err) {
      console.error("Failed to load secrets data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const endpoint = `/secrets/${newSecret.type.toLowerCase()}`;
    
    const payload: any = {
      name: newSecret.name,
      asset_id: parseInt(newSecret.asset_id),
      credential_type: newSecret.type.toUpperCase()
    };
    
    if (newSecret.type === "ssh") {
      payload.username = newSecret.username;
      payload.private_key = newSecret.secretValue;
    } else if (newSecret.type === "smb") {
      payload.username = newSecret.username;
      payload.password = newSecret.secretValue;
      payload.domain = "";
    } else if (newSecret.type === "snmpv2") {
      payload.community_string = newSecret.secretValue;
    } else if (newSecret.type === "http-basic") {
      payload.username = newSecret.username;
      payload.password = newSecret.secretValue;
    } else if (newSecret.type === "database") {
      payload.username = newSecret.username;
      payload.password = newSecret.secretValue;
      payload.db_name = newSecret.dbName || null;
      payload.port = parseInt(newSecret.port) || 5432;
    } else if (newSecret.type === "aws") {
      payload.access_key_id = newSecret.awsAccessKeyId;
      payload.secret_access_key = newSecret.secretValue;
    }

    try {
      await fetchApi(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setIsAddModalOpen(false);
      setNewSecret({ name: "", type: "ssh", username: "", secretValue: "", asset_id: "", dbName: "", port: "5432", awsAccessKeyId: "" });
      loadData();
    } catch (err) {
      console.error("Failed to create secret", err);
      alert("Failed to create secret securely");
    }
  };

  const getAssetName = (id: string) => {
    if (!id) return "-";
    const a = assets.find(a => a.id === id);
    return a ? a.name : `Asset ${id}`;
  };

  const handleDeleteSecret = async (id: string) => {
    if (!confirm("Are you sure you want to securely delete this secret? This action cannot be undone.")) return;
    try {
      await fetchApi(`/secrets/${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      console.error("Failed to delete secret", err);
      alert("Failed to delete secret.");
    }
  };

  const columns = [
    { header: t("colSecretName"), accessor: "name" as const, className: "font-medium" },
    { header: t("colType"), accessor: "credential_type" as const },
    { header: "Asset", accessor: (row: any) => getAssetName(row.asset_id), className: "text-text-muted" },
    { header: t("colUpdated"), accessor: (row: any) => new Date(row.updated_at).toLocaleDateString(), className: "text-text-muted" },
    {
      header: t("colActions"),
      accessor: (row: any) => (
        <button 
          onClick={() => handleDeleteSecret(row.id)}
          className="p-1 text-text-muted hover:text-red-500 transition-colors"
          title="Delete Secret"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="pb-6">
      <PageHeader 
        title={t("title")} 
        description={t("description")} 
        action={
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            {t("newSecret")}
          </button>
        }
      />

      <div className="bg-status-info/10 border border-status-info/20 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Lock className="w-5 h-5 text-status-info shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-status-info mb-1">Secure Vault Storage</h4>
          <p className="text-xs text-text-muted">All credentials are encrypted and stored securely. They are never saved in plaintext in the primary database.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={secrets} 
          keyField="id" 
        />
      )}

      {/* Add Secret Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h3 className="font-semibold text-lg">{t("createSecretTitle")}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSecret} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">{t("secretNameLabel")}</label>
                <input required value={newSecret.name} onChange={e => setNewSecret({...newSecret, name: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. DMZ SSH Key" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">{t("secretTypeLabel")}</label>
                  <select value={newSecret.type} onChange={e => setNewSecret({...newSecret, type: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="ssh">{t("typeSsh")}</option>
                    <option value="smb">{t("typeSmb")}</option>
                    <option value="snmpv2">SNMPv2 Community</option>
                    <option value="http-basic">HTTP Basic Auth</option>
                    <option value="database">{t("typeDb")}</option>
                    <option value="aws">AWS Key</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Asset</label>
                  <select required value={newSecret.asset_id} onChange={e => setNewSecret({...newSecret, asset_id: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                    <option value="">Select an asset</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newSecret.type !== "snmpv2" && newSecret.type !== "aws" && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">{t("usernameLabel")}</label>
                  <input required value={newSecret.username} onChange={e => setNewSecret({...newSecret, username: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="root, admin, or user" />
                </div>
              )}
              
              {newSecret.type === "aws" && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Access Key ID</label>
                  <input required value={newSecret.awsAccessKeyId} onChange={e => setNewSecret({...newSecret, awsAccessKeyId: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="AKIAIOSFODNN7EXAMPLE" />
                </div>
              )}

              {newSecret.type === "database" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Database Name (Optional)</label>
                    <input value={newSecret.dbName} onChange={e => setNewSecret({...newSecret, dbName: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. postgres" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1.5">Port</label>
                    <input required type="number" value={newSecret.port} onChange={e => setNewSecret({...newSecret, port: e.target.value})} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="5432" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  {newSecret.type === "ssh" ? t("privateKeyLabel") : newSecret.type === "snmpv2" ? "Community String" : newSecret.type === "aws" ? "Secret Access Key" : t("passwordLabel")}
                </label>
                <textarea required value={newSecret.secretValue} onChange={e => setNewSecret({...newSecret, secretValue: e.target.value})} rows={3} className="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-mono" placeholder="Enter secret data..." />
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/50">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium hover:bg-base rounded-lg transition-colors">{t("cancel")}</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  <Lock className="w-4 h-4" /> {t("saveSecret")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
