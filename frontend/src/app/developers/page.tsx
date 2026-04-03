"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import Link from "next/link";

interface ApiKey {
  id: number;
  key_prefix: string;
  name: string;
  active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function DevelopersPage() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("Default");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const headers: Record<string, string> = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }
    : {};

  const fetchKeys = () => {
    if (!session?.access_token) return;
    fetch(`${apiUrl}/api/v1/keys`, { headers })
      .then((r) => r.json())
      .then((data) => { setKeys(data.keys || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchKeys(); }, [session]);

  const createKey = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/keys?name=${encodeURIComponent(newKeyName)}`, {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (data.key) {
        setRevealedKey(data.key);
        toast("API key created! Copy it now — it won't be shown again.", "success");
        fetchKeys();
      }
    } catch {
      toast("Failed to create key", "error");
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (id: number) => {
    await fetch(`${apiUrl}/api/v1/keys/${id}`, { method: "DELETE", headers });
    toast("API key revoked", "info");
    fetchKeys();
  };

  const copyKey = () => {
    if (revealedKey) {
      navigator.clipboard.writeText(revealedKey);
      toast("API key copied!", "success");
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-4">Sign in to access the Developer API</p>
          <Link href="/auth/signin" className="px-6 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">Developer API</h1>
      <p className="text-gray-500 mb-8">Integrate Rinse PDF tools into your application</p>

      {/* Revealed key banner */}
      {revealedKey && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-amber-800 mb-2">Your new API key (copy it now — it won't be shown again):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-4 py-2.5 rounded-lg border border-amber-200 text-sm font-mono text-amber-900 break-all">
              {revealedKey}
            </code>
            <button type="button" onClick={copyKey} className="px-4 py-2.5 rounded-lg bg-amber-500 text-white text-sm font-bold shrink-0">Copy</button>
          </div>
          <button type="button" onClick={() => setRevealedKey(null)} className="text-xs text-amber-500 mt-2 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Create key */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-3">Create API Key</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. Production)"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0282e5]"
            aria-label="API key name"
          />
          <button type="button" onClick={createKey} disabled={creating}
            className="px-5 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:bg-[#0170c9] disabled:opacity-60">
            {creating ? "Creating..." : "Create Key"}
          </button>
        </div>
      </div>

      {/* Keys list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-bold text-gray-800">Your API Keys</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No API keys yet. Create one above.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {keys.map((k) => (
              <div key={k.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{k.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${k.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                      {k.active ? "Active" : "Revoked"}
                    </span>
                  </div>
                  <code className="text-xs text-gray-400 font-mono">{k.key_prefix}</code>
                  <span className="text-xs text-gray-300 ml-2">
                    {k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}` : "Never used"}
                  </span>
                </div>
                {k.active && (
                  <button type="button" onClick={() => revokeKey(k.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium">Revoke</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API docs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-[#1a1a2e] mb-4">Quick Start</h2>
        <p className="text-sm text-gray-500 mb-4">Send requests with your API key in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">X-API-Key</code> header.</p>

        <div className="space-y-4">
          {[
            { method: "POST", path: "/api/v1/compress", desc: "Compress a PDF", body: "multipart/form-data with file field" },
            { method: "POST", path: "/api/v1/merge", desc: "Merge multiple PDFs", body: "multipart/form-data with multiple file fields" },
            { method: "POST", path: "/api/v1/to-jpg", desc: "Convert PDF to JPG images (zip)", body: "multipart/form-data with file field" },
            { method: "POST", path: "/api/v1/to-text", desc: "Extract text from PDF", body: "multipart/form-data with file field" },
            { method: "POST", path: "/api/v1/html-to-pdf", desc: "Convert HTML/URL to PDF", body: 'JSON: {"html": "...", "url": "...", "format": "A4"}' },
          ].map((ep) => (
            <div key={ep.path} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">{ep.method}</span>
                <code className="text-sm font-mono text-gray-700">{ep.path}</code>
              </div>
              <p className="text-xs text-gray-500">{ep.desc} &mdash; {ep.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-[#1a1a2e] rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs text-green-400 font-mono whitespace-pre">{`curl -X POST ${apiUrl}/api/v1/compress \\
  -H "X-API-Key: rk_live_your_key_here" \\
  -F "file=@document.pdf" \\
  -o compressed.pdf`}</pre>
        </div>
      </div>
    </div>
  );
}
