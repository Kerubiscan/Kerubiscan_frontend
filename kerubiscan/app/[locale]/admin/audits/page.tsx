"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function AdminAuditsPage() {
  const t = useTranslations("AdminAudits");
  const [audits, setAudits] = useState([]);

  useEffect(() => {
    // Fetch audits from backend
    fetch("/api/v1/admin/audits", {
      headers: {
        // Auth token would be injected here
      }
    })
      .then(res => res.json())
      .then(data => setAudits(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Audit Logs</h1>
      <div className="bg-surface rounded-lg p-6 shadow-md overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr>
              <th className="border-b border-border py-3">Timestamp</th>
              <th className="border-b border-border py-3">User ID</th>
              <th className="border-b border-border py-3">Action</th>
              <th className="border-b border-border py-3">Resource</th>
              <th className="border-b border-border py-3">Status</th>
              <th className="border-b border-border py-3">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((a: any) => (
              <tr key={a.id} className="hover:bg-surface-hover">
                <td className="py-3 border-b border-border">{new Date(a.timestamp).toLocaleString()}</td>
                <td className="py-3 border-b border-border">{a.user_id}</td>
                <td className="py-3 border-b border-border">{a.action}</td>
                <td className="py-3 border-b border-border">{a.resource}</td>
                <td className="py-3 border-b border-border">
                  <span className={`px-2 py-1 rounded text-xs ${a.status === 'SUCCESS' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {a.status}
                  </span>
                </td>
                <td className="py-3 border-b border-border">{a.ip_address}</td>
              </tr>
            ))}
            {audits.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-text-muted">No audit logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
