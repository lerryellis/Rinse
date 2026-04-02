"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Stats {
  total_users: number;
  new_users_today: number;
  total_tasks_today: number;
  total_tasks_week: number;
  total_revenue_ghs: number;
  revenue_this_month: number;
  revenue_today: number;
  top_tools: { tool: string; count: number }[];
}

export default function AdminOverview() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load stats");
        return r.json();
      })
      .then(setStats)
      .catch((e) => setError(e.message));
  }, [session]);

  if (error) {
    return <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-[#0282e5]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.total_users, sub: `+${stats.new_users_today} today`, color: "bg-blue-500" },
    { label: "Tasks Today", value: stats.total_tasks_today, sub: `${stats.total_tasks_week} this week`, color: "bg-green-500" },
    { label: "Revenue Today", value: `GHS ${stats.revenue_today.toFixed(2)}`, sub: `GHS ${stats.revenue_this_month.toFixed(2)} this month`, color: "bg-amber-500" },
    { label: "Total Revenue", value: `GHS ${stats.total_revenue_ghs.toFixed(2)}`, sub: "all time", color: "bg-purple-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-2.5 h-2.5 rounded-full ${card.color}`} />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#1a1a2e]">{card.value}</div>
            <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Top tools */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-gray-800 mb-4">Top Tools (last 7 days)</h2>
        {stats.top_tools.length === 0 ? (
          <p className="text-sm text-gray-400">No usage data yet</p>
        ) : (
          <div className="space-y-3">
            {stats.top_tools.map((t, i) => {
              const maxCount = stats.top_tools[0].count;
              const pct = maxCount > 0 ? (t.count / maxCount) * 100 : 0;
              return (
                <div key={t.tool} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 w-5 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{t.tool}</span>
                      <span className="text-xs text-gray-400">{t.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0282e5] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
