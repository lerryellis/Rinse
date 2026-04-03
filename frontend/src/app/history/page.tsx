"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface UsageRecord {
  id: number;
  tool: string;
  file_size_bytes: number;
  paid: boolean;
  created_at: string;
}

const toolLabels: Record<string, string> = {
  merge: "Merge PDFs",
  split: "Split PDF",
  rotate: "Rotate PDF",
  "delete-pages": "Delete Pages",
  extract: "Extract Pages",
  compress: "Compress PDF",
  "to-word": "PDF to Word",
  "to-excel": "PDF to Excel",
  "to-jpg": "PDF to JPG",
  "to-text": "PDF to Text",
  watermark: "Add Watermark",
  protect: "Protect PDF",
  unlock: "Unlock PDF",
  crop: "Crop PDF",
  "word-to-pdf": "Word to PDF",
  "html-to-pdf": "HTML to PDF",
  resize: "Resize PDF",
};

export default function HistoryPage() {
  const { user, session } = useAuth();
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/auth/history`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => { setRecords(data.records || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-4">Sign in to view your history</p>
          <Link href="/auth/signin" className="px-6 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold">Sign In</Link>
        </div>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatTool = (tool: string) => {
    // Strip :download suffix
    const base = tool.replace(":download", "");
    return toolLabels[base] || base;
  };

  const isDownload = (tool: string) => tool.endsWith(":download");

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">Processing History</h1>
      <p className="text-sm text-gray-400 mb-8">Your recent PDF tool usage</p>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium mb-2">No history yet</p>
          <p className="text-sm text-gray-400 mb-6">Start by using one of our PDF tools</p>
          <Link href="/" className="text-[#0282e5] text-sm font-medium hover:underline">Browse tools</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {records.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                isDownload(r.tool) ? "bg-green-50" : r.paid ? "bg-amber-50" : "bg-blue-50"
              }`}>
                {isDownload(r.tool) ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#0282e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {isDownload(r.tool) ? `Downloaded: ${formatTool(r.tool)}` : formatTool(r.tool)}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleString()}
                  {r.file_size_bytes > 0 && ` · ${formatSize(r.file_size_bytes)}`}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                r.paid ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
              }`}>
                {r.paid ? "Paid" : "Free"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
