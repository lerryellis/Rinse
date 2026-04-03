"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface Segments {
  total: number;
  segments: {
    individuals: number;
    team_members: number;
    api_developers: number;
    paid_users: number;
    admins: number;
    suspended: number;
  };
}

interface Team {
  id: number;
  name: string;
  plan: string;
  member_count: number;
  created_at: string;
  profiles?: { email: string; full_name: string };
}

interface ApiDev {
  user_id: string;
  email: string;
  full_name: string;
  plan: string;
  key_prefix: string;
  last_used_at: string | null;
  total_api_calls: number;
}

export default function CRMPage() {
  const { session } = useAuth();
  const [segments, setSegments] = useState<Segments | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [devs, setDevs] = useState<ApiDev[]>([]);
  const [tab, setTab] = useState<"overview" | "teams" | "api">("overview");
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const headers: Record<string, string> = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  useEffect(() => {
    if (!session?.access_token) return;
    Promise.all([
      fetch(`${apiUrl}/api/admin/crm/segments`, { headers }).then((r) => r.json()),
      fetch(`${apiUrl}/api/admin/crm/teams`, { headers }).then((r) => r.json()),
      fetch(`${apiUrl}/api/admin/crm/api-developers`, { headers }).then((r) => r.json()),
    ]).then(([seg, tm, dv]) => {
      setSegments(seg);
      setTeams(tm.teams || []);
      setDevs(dv.developers || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [session]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Loading CRM...</p></div>;
  }

  const seg = segments?.segments;

  const segmentCards = [
    { label: "Total Users", value: segments?.total || 0, color: "bg-blue-500", filter: "" },
    { label: "Individuals", value: seg?.individuals || 0, color: "bg-green-500", filter: "individual" },
    { label: "Team Members", value: seg?.team_members || 0, color: "bg-purple-500", filter: "team" },
    { label: "API Developers", value: seg?.api_developers || 0, color: "bg-orange-500", filter: "api" },
    { label: "Paid Users", value: seg?.paid_users || 0, color: "bg-amber-500", filter: "paid" },
    { label: "Admins", value: seg?.admins || 0, color: "bg-indigo-500", filter: "admin" },
    { label: "Suspended", value: seg?.suspended || 0, color: "bg-red-500", filter: "suspended" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">CRM — User Segments</h1>

      {/* Segment cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {segmentCards.map((card) => (
          <Link
            key={card.label}
            href={card.filter ? `/admin/users?segment=${card.filter}` : "/admin/users"}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${card.color}`} />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#1a1a2e]">{card.value}</div>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["overview", "teams", "api"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-[#0282e5] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t === "overview" ? "Overview" : t === "teams" ? `Teams (${teams.length})` : `API Devs (${devs.length})`}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-800 mb-4">User Distribution</h2>
          <div className="space-y-3">
            {segmentCards.slice(1).map((card) => {
              const total = segments?.total || 1;
              const pct = Math.round((card.value / total) * 100);
              return (
                <div key={card.label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28">{card.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${card.color}`} style={{ width: `${Math.max(pct, 1)}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right">{pct}%</span>
                  <span className="text-xs font-medium text-gray-600 w-8 text-right">{card.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Teams */}
      {tab === "teams" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Team</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Owner</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Members</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teams.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No teams yet</td></tr>
              ) : teams.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.profiles?.email || "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{t.member_count}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">{t.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* API Developers */}
      {tab === "api" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Developer</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Key</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">API Calls</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Used</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No API developers yet</td></tr>
              ) : devs.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{d.full_name || "—"}</div>
                    <div className="text-xs text-gray-400">{d.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.key_prefix}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{d.total_api_calls}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {d.last_used_at ? new Date(d.last_used_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">{d.plan}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
