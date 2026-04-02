"use client";

import { useState, useRef, useCallback } from "react";
import { mergePdfs } from "@/lib/pdf/merge";
import { splitPdf, getPageCount, type SplitOptions } from "@/lib/pdf/split";
import { rotatePdf, type RotationAngle } from "@/lib/pdf/rotate";
import { deletePages } from "@/lib/pdf/delete-pages";
import { extractPages } from "@/lib/pdf/extract";

interface ToolPageProps {
  slug: string;
  title: string;
  description: string;
  side: "client" | "server";
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
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultData, setResultData] = useState<Uint8Array | Blob | null>(null);
  const [resultMulti, setResultMulti] = useState<{ name: string; data: Uint8Array }[] | null>(null);
  const [resultName, setResultName] = useState("result.pdf");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tool-specific options
  const [splitMode, setSplitMode] = useState<"each" | "ranges">("each");
  const [splitRanges, setSplitRanges] = useState("");
  const [rotateAngle, setRotateAngle] = useState<RotationAngle>(90);
  const [pageInput, setPageInput] = useState("");
  const [pageCount, setPageCount] = useState(0);

  const acceptMultiple = ["merge", "alternate"].includes(slug);
  const acceptTypes = slug === "word-to-pdf" ? ".doc,.docx" : ".pdf";

  const handleFiles = useCallback(async (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
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
    if (files.length === 0) return;
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
        const res = await fetch(`${apiUrl}/api/pdf/${endpoint}`, {
          method: "POST",
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
        {files.length === 0 ? (
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

            {/* Process button */}
            {!hasResult && (
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
