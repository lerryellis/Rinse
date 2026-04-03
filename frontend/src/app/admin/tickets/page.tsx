"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";

interface Ticket {
  id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: { email: string; full_name: string };
}

interface Message {
  id: number;
  message: string;
  is_admin: boolean;
  created_at: string;
  profiles?: { email: string; full_name: string };
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-500",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function AdminTicketsPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Detail view
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const headers: Record<string, string> = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }
    : {};

  const fetchTickets = () => {
    if (!session?.access_token) return;
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    fetch(`${apiUrl}/api/tickets/admin/all?${params}`, { headers })
      .then((r) => r.json())
      .then((data) => { setTickets(data.tickets || []); setTotal(data.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, [session, page, statusFilter]);

  const openTicket = async (ticket: Ticket) => {
    setSelected(ticket);
    const res = await fetch(`${apiUrl}/api/tickets/${ticket.id}`, { headers });
    const data = await res.json();
    setMessages(data.messages || []);
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    await fetch(`${apiUrl}/api/tickets/${selected.id}/reply`, {
      method: "POST", headers, body: JSON.stringify({ message: reply }),
    });
    setReply("");
    openTicket(selected);
    toast("Reply sent", "success");
  };

  const updateStatus = async (ticketId: number, newStatus: string) => {
    await fetch(`${apiUrl}/api/tickets/admin/${ticketId}`, {
      method: "PATCH", headers, body: JSON.stringify({ status: newStatus }),
    });
    toast(`Status updated to ${newStatus}`, "info");
    fetchTickets();
    if (selected?.id === ticketId) setSelected({ ...selected, status: newStatus });
  };

  const totalPages = Math.ceil(total / 20);
  const openCount = tickets.filter((t) => t.status === "open").length;

  // Detail view
  if (selected) {
    return (
      <div>
        <button type="button" onClick={() => setSelected(null)} className="text-sm text-[#0282e5] hover:underline mb-4">
          &larr; Back to all tickets
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[selected.status]}`}>
              {selected.status.replace("_", " ")}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityColors[selected.priority]}`}>
              {selected.priority}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500">{selected.category}</span>
            <span className="text-xs text-gray-400 ml-auto">by {selected.profiles?.email || "unknown"}</span>
          </div>
          <h2 className="text-lg font-bold text-[#1a1a2e] mb-1">{selected.subject}</h2>

          {/* Status actions */}
          <div className="flex gap-2 mt-3">
            {["open", "in_progress", "resolved", "closed"].map((s) => (
              <button key={s} type="button" onClick={() => updateStatus(selected.id, s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selected.status === s ? "bg-[#0282e5] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3 mb-4">
          {messages.map((m) => (
            <div key={m.id} className={`rounded-xl p-4 ${m.is_admin ? "bg-blue-50 border border-blue-200 ml-8" : "bg-white border border-gray-200 mr-8"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-700">{m.profiles?.full_name || m.profiles?.email || "User"}</span>
                {m.is_admin && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-200 text-blue-800">ADMIN</span>}
                <span className="text-xs text-gray-400 ml-auto">{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </div>

        {/* Admin reply */}
        <div className="flex gap-2">
          <input type="text" value={reply} onChange={(e) => setReply(e.target.value)}
            placeholder="Reply as admin..."
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#0282e5]"
            aria-label="Admin reply" />
          <button type="button" onClick={handleReply} disabled={!reply.trim()}
            className="px-5 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold disabled:opacity-60">Send</button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Support Tickets</h1>
          <p className="text-sm text-gray-400">{total} tickets &middot; {openCount} open</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {["", "open", "in_progress", "resolved", "closed"].map((s) => (
          <button key={s} type="button" onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s ? "bg-[#0282e5] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            {s ? s.replace("_", " ") : "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Subject</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Priority</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No tickets</td></tr>
            ) : tickets.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openTicket(t)}>
                <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{t.subject}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{t.profiles?.email || "—"}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-600">{t.category}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityColors[t.priority]}`}>{t.priority}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[t.status]}`}>{t.status.replace("_", " ")}</span></td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(t.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
