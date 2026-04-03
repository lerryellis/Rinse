"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: number;
  ticket_id: number;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_id: string;
  profiles?: { email: string; full_name: string } | null;
}

interface TicketChatProps {
  ticketId: number;
  ticketStatus: string;
  isAdmin?: boolean;
}

export default function TicketChat({ ticketId, ticketStatus, isAdmin = false }: TicketChatProps) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch initial messages
  useEffect(() => {
    if (!session?.access_token) return;
    fetch(`${apiUrl}/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => {});
  }, [ticketId, session]);

  // Subscribe to real-time new messages
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!reply.trim() || !session?.access_token || sending) return;
    setSending(true);

    // Optimistic update
    const optimistic: Message = {
      id: Date.now(),
      ticket_id: ticketId,
      message: reply,
      is_admin: isAdmin,
      created_at: new Date().toISOString(),
      sender_id: "",
      profiles: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setReply("");

    try {
      await fetch(`${apiUrl}/api/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: reply }),
      });
    } catch {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setReply(reply);
    } finally {
      setSending(false);
    }
  };

  const isClosed = ticketStatus === "closed";

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-1 max-h-[400px]">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No messages yet</p>
        )}
        {messages.map((m) => {
          const fromAdmin = m.is_admin;
          const isMe = isAdmin ? fromAdmin : !fromAdmin;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                fromAdmin
                  ? "bg-[#0282e5] text-white rounded-br-md"
                  : "bg-gray-100 text-gray-800 rounded-bl-md"
              }`}>
                {/* Sender label */}
                <div className={`text-[10px] font-semibold mb-0.5 ${fromAdmin ? "text-blue-100" : "text-gray-400"}`}>
                  {fromAdmin ? (isAdmin ? "You" : "Support") : (isAdmin ? (m.profiles?.full_name || m.profiles?.email || "User") : "You")}
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
                <div className={`text-[10px] mt-1 ${fromAdmin ? "text-blue-200" : "text-gray-300"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input area */}
      {isClosed ? (
        <div className="text-center text-xs text-gray-400 py-3 border-t border-gray-100 mt-3">
          This ticket is closed
        </div>
      ) : (
        <div className="flex gap-2 pt-3 mt-3 border-t border-gray-100">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isAdmin ? "Reply as support..." : "Type a message..."}
            className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#0282e5] bg-gray-50"
            aria-label="Message input"
            disabled={sending}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!reply.trim() || sending}
            className="w-10 h-10 rounded-full bg-[#0282e5] text-white flex items-center justify-center hover:bg-[#0170c9] disabled:opacity-40 transition-colors shrink-0"
            aria-label="Send message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
