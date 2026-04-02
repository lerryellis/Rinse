"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface UsageRecord {
  id: number;
  tool: string;
  file_size_bytes: number;
  paid: boolean;
  device_id: string | null;
  created_at: string;
  profiles: { email: string; full_name: string } | null;
}

export default function AdminUsagePage() {
  const { session } = useAuth();
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [toolFilter, setToolFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) return;
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (toolFilter) params.set("tool", toolFilter);

    fetch(`${apiUrl}/api/admin/usage?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setRecords(data.usage || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, page, toolFilter]);

  const formatSize = (bytes: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const totalPages = Math.ceil(total / 30);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Usage Log</h1>
        <span className="text-sm text-gray-400">{total} records</span>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by tool name (e.g. compress, merge)..."
          value={toolFilter}
          onChange={(e) => { setToolFilter(e.target.value); setPage(1); }}
          className="w-full max-w-sm px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#0282e5] focus:ring-1 focus:ring-[#0282e5]"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Tool</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">File Size</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No usage records</td></tr>
            ) : records.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-600">
                  {r.profiles?.email || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-xs font-medium text-gray-700">
                    {r.tool}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatSize(r.file_size_bytes)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    r.paid ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {r.paid ? "Paid" : "Free"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Previous</button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      )}
    </div>
  );
}
