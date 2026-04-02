"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { mergePdfs } from "@/lib/pdf/merge";
import { splitPdf, getPageCount, type SplitOptions } from "@/lib/pdf/split";
import { rotatePdf, type RotationAngle } from "@/lib/pdf/rotate";
import { deletePages } from "@/lib/pdf/delete-pages";
import { extractPages } from "@/lib/pdf/extract";
import { useAuth } from "@/context/AuthContext";

interface ToolPageProps {
  slug: string;
  title: string;
  description: string;
  side: "client" | "server";
}

interface UsageInfo {
  total_used: number;
  free_limit: number;
  free_remaining: number;
  needs_payment: boolean;
  price_per_file_ghs: number;
  resets_at: string | null;
}

function formatTimeLeft(resetsAt: string): string {
  const now = new Date().getTime();
  const reset = new Date(resetsAt).getTime();
  const diff = reset - now;
  if (diff <= 0) return "soon";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function downloadBlob(data: Uint8Array | Blob, filename: string) {
  const blob = data instanceof Blob ? data : new Blob([data.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadZip(files: { name: string; data: Uint8Array }[]) {
  // For split: download each file individually (simple approach)
  files.forEach((f) => downloadBlob(f.data, f.name));
}

export default function ToolPage({ slug, title, description, side }: ToolPageProps) {
  const { user, session, emailVerified } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultData, setResultData] = useState<Uint8Array | Blob | null>(null);
  const [resultMulti, setResultMulti] = useState<{ name: string; data: Uint8Array }[] | null>(null);
  const [resultName, setResultName] = useState("result.pdf");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Usage & payment state
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Tool-specific options
  const [splitMode, setSplitMode] = useState<"each" | "ranges">("each");
  const [splitRanges, setSplitRanges] = useState("");
  const [rotateAngle, setRotateAngle] = useState<RotationAngle>(90);
  const [pageInput, setPageInput] = useState("");
  const [pageCount, setPageCount] = useState(0);

  const acceptMultiple = ["merge", "alternate"].includes(slug);
  const isHtmlTool = slug === "html-to-pdf";
  const acceptTypes = slug === "word-to-pdf" ? ".doc,.docx" : isHtmlTool ? ".html,.htm" : ".pdf";

  // HTML-to-PDF specific state
  const [htmlMode, setHtmlMode] = useState<"url" | "code" | "file">("url");
  const [htmlUrl, setHtmlUrl] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [htmlFormat, setHtmlFormat] = useState("A4");
  const [htmlLandscape, setHtmlLandscape] = useState(false);

  // Fetch usage on mount (with device fingerprint)
  useEffect(() => {
    if (!session?.access_token) return;
    const fetchUsage = async () => {
      const { getDeviceId } = await import("@/lib/fingerprint");
      const deviceId = await getDeviceId();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/auth/usage`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "X-Device-Id": deviceId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    };
    fetchUsage().catch(() => {});
  }, [session]);

  // Initiate Paystack payment
  const initiatePayment = async () => {
    setPaymentLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      try {
        const { getDeviceId } = await import("@/lib/fingerprint");
        headers["X-Device-Id"] = await getDeviceId();
      } catch {}

      localStorage.setItem("rinse_pending_tool", slug);

      const res = await fetch(`${apiUrl}/api/payments/initialize`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          tool: slug,
          callback_url: `${window.location.origin}/payment/verify`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Payment failed" }));
        throw new Error(err.detail);
      }

      const data = await res.json();
      window.location.href = data.authorization_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setPaymentLoading(false);
    }
  };

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  const handleFiles = useCallback(async (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);

    // Reject files over 50 MB
    const oversized = arr.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`"${oversized.name}" is ${(oversized.size / (1024 * 1024)).toFixed(1)} MB. Maximum file size is 50 MB.`);
      return;
    }

    const newFiles = acceptMultiple ? [...files, ...arr] : arr.slice(0, 1);
    setFiles(newFiles);
    setResultData(null);
    setResultMulti(null);
    setError(null);

    // Get page count for single-file tools
    if (!acceptMultiple && newFiles.length === 1 && newFiles[0].name.endsWith(".pdf")) {
      try {
        const count = await getPageCount(newFiles[0]);
        setPageCount(count);
      } catch {
        setPageCount(0);
      }
    }
  }, [acceptMultiple, files]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    // HTML tool doesn't require files in url/code mode
    if (!isHtmlTool && files.length === 0) return;
    if (isHtmlTool && htmlMode === "url" && !htmlUrl) return;
    if (isHtmlTool && htmlMode === "code" && !htmlCode) return;
    if (isHtmlTool && htmlMode === "file" && files.length === 0) return;
    setProcessing(true);
    setError(null);
    setResultData(null);
    setResultMulti(null);

    try {
      // ─── Client-side tools ───
      if (slug === "merge") {
        const result = await mergePdfs(files);
        setResultData(result);
        setResultName("merged.pdf");
      } else if (slug === "split") {
        const opts: SplitOptions = splitMode === "ranges"
          ? { mode: "ranges", ranges: splitRanges }
          : { mode: "each" };
        const results = await splitPdf(files[0], opts);
        setResultMulti(results);
      } else if (slug === "rotate") {
        const result = await rotatePdf(files[0], rotateAngle);
        setResultData(result);
        setResultName("rotated.pdf");
      } else if (slug === "delete-pages") {
        const pages = parsePageNumbers(pageInput);
        if (pages.length === 0) throw new Error("Enter at least one page number to delete");
        const result = await deletePages(files[0], pages);
        setResultData(result);
        setResultName("pages-deleted.pdf");
      } else if (slug === "extract") {
        const pages = parsePageNumbers(pageInput);
        if (pages.length === 0) throw new Error("Enter at least one page number to extract");
        const result = await extractPages(files[0], pages);
        setResultData(result);
        setResultName("extracted.pdf");
      } else if (side === "client") {
        // Placeholder for other client tools
        await new Promise((r) => setTimeout(r, 1000));
        setResultData(new Uint8Array());
        setResultName("result.pdf");
      }

      // ─── HTML to PDF ───
      else if (isHtmlTool) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const fetchHeaders: Record<string, string> = {};
        if (session?.access_token) {
          fetchHeaders["Authorization"] = `Bearer ${session.access_token}`;
        }
        try {
          const { getDeviceId } = await import("@/lib/fingerprint");
          fetchHeaders["X-Device-Id"] = await getDeviceId();
        } catch {}

        let res: Response;

        if (htmlMode === "file" && files.length > 0) {
          const formData = new FormData();
          formData.append("file", files[0]);
          formData.append("format", htmlFormat);
          formData.append("landscape", String(htmlLandscape));
          res = await fetch(`${apiUrl}/api/pdf/html-to-pdf`, {
            method: "POST",
            headers: fetchHeaders,
            body: formData,
          });
        } else {
          fetchHeaders["Content-Type"] = "application/json";
          res = await fetch(`${apiUrl}/api/pdf/html-to-pdf`, {
            method: "POST",
            headers: fetchHeaders,
            body: JSON.stringify({
              ...(htmlMode === "url" ? { url: htmlUrl } : { html: htmlCode }),
              format: htmlFormat,
              landscape: htmlLandscape,
            }),
          });
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Conversion failed" }));
          throw new Error(err.detail);
        }

        const blob = await res.blob();
        setResultData(blob);
        setResultName("html-converted.pdf");
      }

      // ─── Server-side tools ───
      else {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const formData = new FormData();
        formData.append("file", files[0]);

        const endpointMap: Record<string, string> = {
          compress: "compress",
          "pdf-to-word": "to-word",
          "pdf-to-excel": "to-excel",
          "pdf-to-jpg": "to-jpg",
          "pdf-to-pptx": "to-pptx",
          "pdf-to-text": "to-text",
          ocr: "ocr",
          watermark: "watermark",
          protect: "protect",
          unlock: "unlock",
          crop: "crop",
          "word-to-pdf": "word-to-pdf",
        };

        const endpoint = endpointMap[slug] || slug;
        const fetchHeaders: Record<string, string> = {};
        if (session?.access_token) {
          fetchHeaders["Authorization"] = `Bearer ${session.access_token}`;
        }
        try {
          const { getDeviceId } = await import("@/lib/fingerprint");
          fetchHeaders["X-Device-Id"] = await getDeviceId();
        } catch {}
        const res = await fetch(`${apiUrl}/api/pdf/${endpoint}`, {
          method: "POST",
          headers: fetchHeaders,
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Processing failed" }));
          throw new Error(err.detail);
        }

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/pdf") || contentType.includes("application/octet-stream")) {
          const blob = await res.blob();
          setResultData(blob);
          const ext = slug.includes("word") ? ".docx" : slug.includes("excel") ? ".xlsx" : slug.includes("jpg") ? ".zip" : ".pdf";
          setResultName(`${slug}-result${ext}`);
        } else {
          // JSON response (stub endpoints)
          const json = await res.json();
          setResultData(new Uint8Array());
          setResultName("result.pdf");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultMulti) {
      downloadZip(resultMulti);
    } else if (resultData) {
      downloadBlob(resultData, resultName);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const hasResult = resultData !== null || resultMulti !== null;

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-2">
            {title}
          </h1>
          <p className="text-gray-500 text-lg">{description}</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-[13px] text-gray-400">
            <span>Free to use</span>
            <span>&middot;</span>
            <span>No registration</span>
            <span>&middot;</span>
            <span>Files deleted after 2h</span>
          </div>
        </div>
      </div>

      {/* Upload / Processing area */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {!user ? (
          /* ─── Sign-in gate ─── */
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1">
              Sign in to use {title}
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Create a free account to get 2 free conversions every 24 hours
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="/auth/signin"
                className="px-6 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:bg-[#0170c9] transition-colors"
              >
                Sign In
              </a>
              <a
                href="/auth/signup"
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:border-[#0282e5] hover:text-[#0282e5] transition-colors"
              >
                Create Account
              </a>
            </div>
          </div>
        ) : user && !emailVerified ? (
          /* ─── Email verification gate ─── */
          <div className="border-2 border-dashed border-amber-300 rounded-2xl p-12 text-center bg-amber-50">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-amber-800 mb-1">
              Verify your email to continue
            </p>
            <p className="text-sm text-amber-600 mb-2">
              We sent a confirmation link to <strong>{user.email}</strong>
            </p>
            <p className="text-xs text-amber-500">
              Check your inbox (and spam folder), then refresh this page.
            </p>
          </div>
        ) : isHtmlTool && files.length === 0 ? (
          /* ─── HTML to PDF input ─── */
          <div className="space-y-4">
            {/* Mode selector */}
            <div className="flex gap-2">
              {([["url", "From URL"], ["code", "Paste HTML"], ["file", "Upload File"]] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setHtmlMode(mode)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    htmlMode === mode ? "bg-[#0282e5] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {htmlMode === "url" && (
              <div>
                <label htmlFor="html-url" className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input
                  id="html-url"
                  type="url"
                  placeholder="https://example.com"
                  value={htmlUrl}
                  onChange={(e) => setHtmlUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-[#0282e5] focus:ring-1 focus:ring-[#0282e5]"
                />
              </div>
            )}

            {htmlMode === "code" && (
              <div>
                <label htmlFor="html-code" className="block text-sm font-medium text-gray-700 mb-1">HTML Code</label>
                <textarea
                  id="html-code"
                  placeholder="<html><body><h1>Hello World</h1></body></html>"
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:border-[#0282e5] focus:ring-1 focus:ring-[#0282e5] resize-y"
                />
              </div>
            )}

            {htmlMode === "file" && (
              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? "border-[#0282e5] bg-blue-50" : "border-gray-300 hover:border-[#0282e5] hover:bg-blue-50/30"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept=".html,.htm" className="hidden" aria-label="Upload HTML file" onChange={(e) => handleFiles(e.target.files)} />
                <p className="text-base font-semibold text-gray-700 mb-1">Drop your HTML file here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </div>
            )}

            {/* Format options */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4">
              <div>
                <label htmlFor="page-format" className="block text-xs font-medium text-gray-500 mb-1">Page Size</label>
                <select
                  id="page-format"
                  value={htmlFormat}
                  onChange={(e) => setHtmlFormat(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="A3">A3</option>
                  <option value="Legal">Legal</option>
                  <option value="Tabloid">Tabloid</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={htmlLandscape}
                    onChange={(e) => setHtmlLandscape(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#0282e5] focus:ring-[#0282e5]"
                  />
                  <span className="text-sm text-gray-600">Landscape</span>
                </label>
              </div>
            </div>

            {/* Usage + process/payment buttons for HTML tool */}
            {!hasResult && usage && (
              <div className={`p-3 rounded-xl text-sm text-center ${usage.needs_payment ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-blue-50 border border-blue-200 text-blue-700"}`}>
                {usage.needs_payment ? (
                  <>
                    You&apos;ve used your {usage.free_limit} free conversions. Next action costs <strong>GHS {usage.price_per_file_ghs.toFixed(2)}</strong>
                    {usage.resets_at && (
                      <span className="block mt-1 text-xs text-amber-500">
                        Free uses reset in {formatTimeLeft(usage.resets_at)}
                      </span>
                    )}
                  </>
                ) : (
                  <>{usage.free_remaining} of {usage.free_limit} free conversions remaining &middot; resets every 24h</>
                )}
              </div>
            )}

            {!hasResult && usage?.needs_payment ? (
              <button type="button" onClick={initiatePayment} disabled={paymentLoading}
                className="w-full py-4 rounded-xl bg-[#00BB88] text-white text-base font-bold hover:bg-[#00a87a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {paymentLoading ? "Redirecting to payment..." : `Pay GHS ${usage.price_per_file_ghs.toFixed(2)} & Convert to PDF`}
              </button>
            ) : !hasResult && (
              <button type="button" onClick={handleProcess} disabled={processing}
                className="w-full py-4 rounded-xl bg-[#0282e5] text-white text-base font-bold hover:bg-[#0170c9] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Converting...
                  </span>
                ) : "Convert to PDF"}
              </button>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
            )}

            {hasResult && (
              <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-800 font-semibold mb-1">Done!</p>
                <p className="text-sm text-green-600 mb-4">Your PDF has been generated.</p>
                <button type="button" onClick={handleDownload}
                  className="px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors">
                  Download PDF
                </button>
              </div>
            )}
          </div>
        ) : files.length === 0 && !isHtmlTool ? (
          /* ─── Drop zone ─── */
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-[#0282e5] bg-blue-50"
                : "border-gray-300 hover:border-[#0282e5] hover:bg-blue-50/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept={acceptTypes}
              multiple={acceptMultiple}
              className="hidden"
              aria-label="Upload file"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#0282e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1">
              Drop your {slug === "word-to-pdf" ? "Word document" : acceptMultiple ? "PDFs" : "PDF"} here
            </p>
            <p className="text-sm text-gray-400">
              or click to browse &middot; Max 50 MB
              {acceptMultiple && " · Select multiple files"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File list */}
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-red-400 uppercase">
                      {f.name.split(".").pop()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatSize(f.size)}
                      {pageCount > 0 && !acceptMultiple && ` · ${pageCount} pages`}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => removeFile(i)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Add more files (merge/alternate) */}
            {acceptMultiple && !hasResult && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:border-[#0282e5] hover:text-[#0282e5] transition-colors"
              >
                + Add more files
              </button>
            )}

            <input
              ref={inputRef}
              type="file"
              accept={acceptTypes}
              multiple={acceptMultiple}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* ─── Tool-specific options ─── */}
            {!hasResult && slug === "split" && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Split mode</h3>
                <div className="flex gap-3">
                  <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-colors ${splitMode === "each" ? "border-[#0282e5] bg-blue-50" : "border-gray-200"}`}>
                    <input type="radio" name="splitMode" aria-label="Split every page" className="hidden" checked={splitMode === "each"} onChange={() => setSplitMode("each")} />
                    <div className="text-sm font-medium text-gray-800">Every page</div>
                    <div className="text-xs text-gray-400 mt-0.5">One PDF per page</div>
                  </label>
                  <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-colors ${splitMode === "ranges" ? "border-[#0282e5] bg-blue-50" : "border-gray-200"}`}>
                    <input type="radio" name="splitMode" aria-label="Split by custom ranges" className="hidden" checked={splitMode === "ranges"} onChange={() => setSplitMode("ranges")} />
                    <div className="text-sm font-medium text-gray-800">Custom ranges</div>
                    <div className="text-xs text-gray-400 mt-0.5">Specify page ranges</div>
                  </label>
                </div>
                {splitMode === "ranges" && (
                  <input
                    type="text"
                    placeholder={`e.g. 1-3, 5, 7-${pageCount || 10}`}
                    value={splitRanges}
                    onChange={(e) => setSplitRanges(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0282e5] focus:ring-1 focus:ring-[#0282e5]"
                  />
                )}
              </div>
            )}

            {!hasResult && slug === "rotate" && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Rotation angle</h3>
                <div className="flex gap-3">
                  {([90, 180, 270] as RotationAngle[]).map((a) => (
                    <label key={a} className={`flex-1 p-3 rounded-lg border-2 cursor-pointer text-center transition-colors ${rotateAngle === a ? "border-[#0282e5] bg-blue-50" : "border-gray-200"}`}>
                      <input type="radio" name="rotateAngle" aria-label={`Rotate ${a} degrees`} className="hidden" checked={rotateAngle === a} onChange={() => setRotateAngle(a)} />
                      <div className="text-sm font-medium text-gray-800">{a}°</div>
                      <div className="text-xs text-gray-400 mt-0.5">{a === 90 ? "Clockwise" : a === 180 ? "Flip" : "Counter-CW"}</div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {!hasResult && (slug === "delete-pages" || slug === "extract") && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  {slug === "delete-pages" ? "Pages to delete" : "Pages to extract"}
                </h3>
                <input
                  type="text"
                  placeholder={`e.g. 1, 3, 5-7 (total: ${pageCount || "?"} pages)`}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0282e5] focus:ring-1 focus:ring-[#0282e5]"
                />
              </div>
            )}

            {/* Usage info banner */}
            {!hasResult && usage && (
              <div className={`p-3 rounded-xl text-sm text-center ${usage.needs_payment ? "bg-amber-50 border border-amber-200 text-amber-700" : "bg-blue-50 border border-blue-200 text-blue-700"}`}>
                {usage.needs_payment ? (
                  <>
                    You&apos;ve used your {usage.free_limit} free conversions. Next action costs <strong>GHS {usage.price_per_file_ghs.toFixed(2)}</strong>
                    {usage.resets_at && (
                      <span className="block mt-1 text-xs text-amber-500">
                        Free uses reset in {formatTimeLeft(usage.resets_at)}
                      </span>
                    )}
                  </>
                ) : (
                  <>{usage.free_remaining} of {usage.free_limit} free conversions remaining &middot; resets every 24h</>
                )}
              </div>
            )}

            {/* Process button OR payment button */}
            {!hasResult && usage?.needs_payment ? (
              <button
                type="button"
                onClick={initiatePayment}
                disabled={paymentLoading}
                className="w-full py-4 rounded-xl bg-[#00BB88] text-white text-base font-bold hover:bg-[#00a87a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {paymentLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Redirecting to payment...
                  </span>
                ) : (
                  <>Pay GHS {usage.price_per_file_ghs.toFixed(2)} &amp; {title}</>
                )}
              </button>
            ) : !hasResult && (
              <button
                type="button"
                onClick={handleProcess}
                disabled={processing}
                className="w-full py-4 rounded-xl bg-[#0282e5] text-white text-base font-bold hover:bg-[#0170c9] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  title
                )}
              </button>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Result */}
            {hasResult && (
              <div className="p-6 rounded-xl bg-green-50 border border-green-200 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-800 font-semibold mb-1">Done!</p>
                <p className="text-sm text-green-600 mb-4">
                  {resultMulti
                    ? `Split into ${resultMulti.length} files`
                    : "Your file has been processed successfully."}
                </p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
                >
                  {resultMulti ? `Download ${resultMulti.length} Files` : "Download Result"}
                </button>
              </div>
            )}

            {/* Reset */}
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setResultData(null);
                setResultMulti(null);
                setError(null);
                setPageCount(0);
                setPageInput("");
                setSplitRanges("");
              }}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Start over with a new file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function parsePageNumbers(input: string): number[] {
  const pages: number[] = [];
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      if (!isNaN(a) && !isNaN(b)) {
        for (let i = a; i <= b; i++) pages.push(i);
      }
    } else {
      const n = Number(part);
      if (!isNaN(n)) pages.push(n);
    }
  }
  return pages;
}
