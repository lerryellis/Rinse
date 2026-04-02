"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Payment {
  id: number;
  reference: string;
  amount_ghs: number;
  status: string;
  tool: string;
  created_at: string;
  profiles: { email: string; full_name: string } | null;
}

export default function AdminPaymentsPage() {
  const { session } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) return;
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter) params.set("status", filter);

    fetch(`${apiUrl}/api/admin/payments?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.payments || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, page, filter]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Payments</h1>
        <span className="text-sm text-gray-400">{total} total</span>
      </div>

      <div className="flex gap-2 mb-4">
        {["", "success", "pending", "failed"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s ? "bg-[#0282e5] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Reference</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Tool</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No payments found</td></tr>
            ) : payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.reference}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {p.profiles?.email || "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{p.tool || "—"}</td>
                <td className="px-4 py-3 font-medium text-gray-800">GHS {Number(p.amount_ghs).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    p.status === "success" ? "bg-green-100 text-green-700" :
                    p.status === "pending" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-600"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(p.created_at).toLocaleString()}
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
