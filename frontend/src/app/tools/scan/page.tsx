"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface PageInfo {
  page_number: number;
  width_mm: number;
  height_mm: number;
  orientation: string;
  detected_size: string | null;
  margin_top_mm: number;
  margin_bottom_mm: number;
  margin_left_mm: number;
  margin_right_mm: number;
  has_text: boolean;
  has_images: boolean;
  text_coverage_pct: number;
}

interface Analysis {
  total_pages: number;
  pages: PageInfo[];
  dominant_size: string | null;
  is_consistent: boolean;
  suggested_print_size: string;
  suggested_orientation: string;
  suggestion_reason: string;
  has_non_standard_pages: boolean;
  file_size_bytes: number;
}

export default function ScanPage() {
  const { user, session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resizing, setResizing] = useState(false);
  const [targetSize, setTargetSize] = useState("A4");
  const [targetOrient, setTargetOrient] = useState("portrait");
  const [targetMargin, setTargetMargin] = useState(10);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setAnalysis(null);
    setError(null);
  };

  const handleScan = async () => {
    if (!file || !session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${apiUrl}/api/analyze/scan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Scan failed" }));
        throw new Error(err.detail);
      }
      const data: Analysis = await res.json();
      setAnalysis(data);
      setTargetSize(data.suggested_print_size);
      setTargetOrient(data.suggested_orientation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResize = async () => {
    if (!file || !session?.access_token) return;
    setResizing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formData = new FormData();
      formData.append("file", file);
      const params = new URLSearchParams({
        target_size: targetSize,
        orientation: targetOrient,
        margin_mm: String(targetMargin),
      });
      const res = await fetch(`${apiUrl}/api/analyze/resize?${params}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Resize failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resized-${targetSize}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resize failed");
    } finally {
      setResizing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-4">Sign in to scan documents</p>
          <Link href="/auth/signin" className="px-6 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-2">Document Scanner & Layout Analyzer</h1>
          <p className="text-gray-500 text-lg">Detect page sizes, analyze margins, and get print layout recommendations</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Upload */}
        {!file && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-[#0282e5] hover:bg-blue-50/30 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" aria-label="Upload PDF to scan" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#7c5cfc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1">Drop your PDF here to scan</p>
            <p className="text-sm text-gray-400">We&apos;ll analyze page sizes, margins, and suggest the best print layout</p>
          </div>
        )}

        {/* File selected, scan button */}
        {file && !analysis && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-red-400">PDF</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button type="button" onClick={() => { setFile(null); setAnalysis(null); }} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
            </div>
            <button type="button" onClick={handleScan} disabled={loading}
              className="w-full py-4 rounded-xl bg-[#7c5cfc] text-white text-base font-bold hover:bg-[#6a4de0] disabled:opacity-60 transition-colors">
              {loading ? "Scanning document..." : "Scan & Analyze"}
            </button>
          </div>
        )}

        {error && <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}

        {/* Analysis results */}
        {analysis && (
          <div className="space-y-6 mt-2">
            {/* Suggestion card */}
            <div className="bg-[#f3eeff] border-2 border-[#7c5cfc] rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#7c5cfc] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1a1a2e] mb-1">
                    Recommended: {analysis.suggested_print_size} {analysis.suggested_orientation}
                  </h3>
                  <p className="text-sm text-gray-600">{analysis.suggestion_reason}</p>
                </div>
              </div>
            </div>

            {/* Overview stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-[#1a1a2e]">{analysis.total_pages}</div>
                <div className="text-xs text-gray-400 mt-1">Pages</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-[#1a1a2e]">{analysis.dominant_size || "Custom"}</div>
                <div className="text-xs text-gray-400 mt-1">Detected Size</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-[#1a1a2e]">{analysis.is_consistent ? "Yes" : "No"}</div>
                <div className="text-xs text-gray-400 mt-1">Consistent Layout</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-2xl font-bold text-[#1a1a2e]">{(analysis.file_size_bytes / 1024).toFixed(0)} KB</div>
                <div className="text-xs text-gray-400 mt-1">File Size</div>
              </div>
            </div>

            {/* Page-by-page breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-800">Page-by-Page Analysis</h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {analysis.pages.map((p) => (
                  <div key={p.page_number} className="px-5 py-3 flex items-center gap-4 text-sm">
                    <span className="text-xs font-mono text-gray-400 w-8">P{p.page_number}</span>
                    <span className="font-medium text-gray-700 w-20">{p.detected_size || "Custom"}</span>
                    <span className="text-gray-500 w-28">{p.width_mm} x {p.height_mm} mm</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.orientation === "landscape" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {p.orientation}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      Margins: {p.margin_top_mm.toFixed(0)}t {p.margin_bottom_mm.toFixed(0)}b {p.margin_left_mm.toFixed(0)}l {p.margin_right_mm.toFixed(0)}r mm
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resize tool */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Resize for Print</h3>
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <label htmlFor="resize-size" className="block text-xs font-medium text-gray-500 mb-1">Target Size</label>
                  <select id="resize-size" value={targetSize} onChange={(e) => setTargetSize(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
                    {["A3", "A4", "A5", "Letter", "Legal", "Tabloid", "Executive", "B4", "B5"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="resize-orient" className="block text-xs font-medium text-gray-500 mb-1">Orientation</label>
                  <select id="resize-orient" value={targetOrient} onChange={(e) => setTargetOrient(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="resize-margin" className="block text-xs font-medium text-gray-500 mb-1">Margin (mm)</label>
                  <input id="resize-margin" type="number" min={0} max={50} value={targetMargin}
                    onChange={(e) => setTargetMargin(Number(e.target.value))}
                    className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </div>
              </div>
              <button type="button" onClick={handleResize} disabled={resizing}
                className="px-6 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:bg-[#0170c9] disabled:opacity-60 transition-colors">
                {resizing ? "Resizing..." : `Resize to ${targetSize} ${targetOrient}`}
              </button>
            </div>

            {/* Start over */}
            <button type="button" onClick={() => { setFile(null); setAnalysis(null); setError(null); }}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Scan another document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
