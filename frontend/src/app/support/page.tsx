"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import TicketChat from "@/components/TicketChat";
import Link from "next/link";

interface Ticket {
  id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  message: string;
  is_admin: boolean;
  created_at: string;
  profiles?: { email: string; full_name: string };
}

const categories = [
  { value: "general", label: "General Question" },
  { value: "bug", label: "Bug Report" },
  { value: "payment", label: "Payment Issue" },
  { value: "account", label: "Account Problem" },
  { value: "tool_error", label: "Tool Not Working" },
  { value: "feature_request", label: "Feature Request" },
  { value: "api", label: "API / Developer" },
];

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

export default function SupportPage() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");

  // Create form
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const headers: Record<string, string> = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }
    : {};

  const fetchTickets = () => {
    if (!session?.access_token) return;
    fetch(`${apiUrl}/api/tickets/my-tickets`, { headers })
      .then((r) => r.json())
      .then((data) => { setTickets(data.tickets || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, [session]);

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setView("detail");
    const res = await fetch(`${apiUrl}/api/tickets/${ticket.id}`, { headers });
    const data = await res.json();
    setMessages(data.messages || []);
  };

  const handleCreate = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    const res = await fetch(`${apiUrl}/api/tickets/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({ subject, description, category, priority }),
    });
    if (res.ok) {
      toast("Ticket submitted! We'll get back to you soon.", "success");
      setSubject(""); setDescription(""); setCategory("general"); setPriority("medium");
      setView("list");
      fetchTickets();
    } else {
      toast("Failed to submit ticket", "error");
    }
    setSubmitting(false);
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    await fetch(`${apiUrl}/api/tickets/${selectedTicket.id}/reply`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: reply }),
    });
    setReply("");
    openTicket(selectedTicket);
    toast("Reply sent", "success");
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-4">Sign in to access support</p>
          <Link href="/auth/signin" className="px-6 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Support</h1>
          <p className="text-sm text-gray-500">Get help with your account, tools, or payments</p>
        </div>
        {view === "list" && (
          <button type="button" onClick={() => setView("create")}
            className="px-5 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:bg-[#0170c9]">
            New Ticket
          </button>
        )}
        {view !== "list" && (
          <button type="button" onClick={() => setView("list")} className="text-sm text-[#0282e5] hover:underline">
            &larr; Back to tickets
          </button>
        )}
      </div>

      {/* Create ticket */}
      {view === "create" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label htmlFor="ticket-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input id="ticket-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#0282e5]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ticket-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select id="ticket-category" value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm">
                {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ticket-priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select id="ticket-priority" value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="ticket-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="ticket-desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in detail. Include any error messages, file types, or steps to reproduce."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm resize-y focus:outline-none focus:border-[#0282e5]" />
          </div>
          <button type="button" onClick={handleCreate} disabled={submitting || !subject.trim() || !description.trim()}
            className="w-full py-3 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:bg-[#0170c9] disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      )}

      {/* Ticket list */}
      {view === "list" && (
        loading ? <p className="text-center text-gray-400 py-12">Loading...</p> :
        tickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 font-medium mb-2">No tickets yet</p>
            <p className="text-sm text-gray-400">Create a ticket if you need help</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {tickets.map((t) => (
              <button key={t.id} type="button" onClick={() => openTicket(t)}
                className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[t.status] || "bg-gray-100"}`}>
                    {t.status.replace("_", " ")}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500">{t.category}</span>
                  <span className="text-xs text-gray-400 ml-auto">{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-gray-800">{t.subject}</p>
              </button>
            ))}
          </div>
        )
      )}

      {/* Ticket detail with real-time chat */}
      {view === "detail" && selectedTicket && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[selectedTicket.status]}`}>
                {selectedTicket.status.replace("_", " ")}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500">{selectedTicket.category}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500">{selectedTicket.priority}</span>
            </div>
            <h2 className="text-lg font-bold text-[#1a1a2e]">{selectedTicket.subject}</h2>
            <p className="text-xs text-gray-400 mt-1">Opened {new Date(selectedTicket.created_at).toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <TicketChat ticketId={selectedTicket.id} ticketStatus={selectedTicket.status} isAdmin={false} />
          </div>
        </div>
      )}
    </div>
  );
}
