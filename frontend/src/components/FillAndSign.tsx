"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";

interface Placement {
  id: string;
  type: "text" | "signature" | "date" | "initials";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
}

function downloadBlob(data: Uint8Array, filename: string) {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FillAndSign() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale] = useState(1.2);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "text" | "signature" | "date" | "initials">("select");
  const [saving, setSaving] = useState(false);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

  // Signature pad state
  const [showSigPad, setShowSigPad] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfBytes || !canvasRef.current) return;
    const pdfjsLib = await import("pdfjs-dist");
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    setPageSize({ width: viewport.width, height: viewport.height });
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvas, viewport } as any).promise;
  }, [pdfBytes, scale]);

  useEffect(() => {
    if (pdfBytes) renderPage(currentPage);
  }, [pdfBytes, currentPage, renderPage]);

  const handleFileUpload = async (f: File) => {
    const bytes = await f.arrayBuffer();
    setPdfBytes(bytes);
    setFile(f);
    setPlacements([]);
    setCurrentPage(1);
    const pdfjsLib = await import("pdfjs-dist");
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    setTotalPages(pdf.numPages);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool === "select") { setSelectedId(null); return; }
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = `p-${Date.now()}`;

    if (tool === "text") {
      setPlacements((prev) => [...prev, { id, type: "text", page: currentPage, x, y, width: 200, height: 28, content: "Type here", fontSize: 14 }]);
      setSelectedId(id);
      setTool("select");
    } else if (tool === "date") {
      const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      setPlacements((prev) => [...prev, { id, type: "date", page: currentPage, x, y, width: 180, height: 24, content: today, fontSize: 12 }]);
      setSelectedId(id);
      setTool("select");
    } else if (tool === "initials") {
      const initials = user?.email?.charAt(0).toUpperCase() || "A";
      setPlacements((prev) => [...prev, { id, type: "initials", page: currentPage, x, y, width: 40, height: 28, content: initials, fontSize: 18 }]);
      setSelectedId(id);
      setTool("select");
    } else if (tool === "signature") {
      if (!signatureDataUrl) {
        setShowSigPad(true);
        (window as any).__rinseSigPos = { x, y };
        return;
      }
      setPlacements((prev) => [...prev, { id, type: "signature", page: currentPage, x, y, width: 200, height: 80, content: signatureDataUrl }]);
      setSelectedId(id);
      setTool("select");
    }
  };

  // Signature drawing
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const canvas = sigCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const pos = "touches" in e ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top } : { x: e.clientX - rect.left, y: e.clientY - rect.top };
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = sigCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const pos = "touches" in e ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top } : { x: e.clientX - rect.left, y: e.clientY - rect.top };
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => setDrawing(false);

  const clearSig = () => {
    const canvas = sigCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSig = () => {
    const dataUrl = sigCanvasRef.current!.toDataURL("image/png");
    setSignatureDataUrl(dataUrl);
    setShowSigPad(false);
    // Place signature if we were in the middle of placing one
    const pos = (window as any).__rinseSigPos;
    if (pos) {
      const id = `p-${Date.now()}`;
      setPlacements((prev) => [...prev, { id, type: "signature", page: currentPage, x: pos.x, y: pos.y, width: 200, height: 80, content: dataUrl }]);
      setSelectedId(id);
      setTool("select");
      delete (window as any).__rinseSigPos;
    }
  };

  const updatePlacement = (id: string, updates: Partial<Placement>) => {
    setPlacements((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePlacement = (id: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    setSelectedId(null);
  };

  const handleSave = async () => {
    if (!pdfBytes) return;
    setSaving(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);

      for (const p of placements) {
        const page = pdfDoc.getPage(p.page - 1);
        const { height: ph } = page.getSize();
        const pdfX = p.x / scale;
        const pdfY = ph - (p.y / scale) - (p.height / scale);

        if (p.type === "signature" && p.content.startsWith("data:image")) {
          const img = await pdfDoc.embedPng(p.content);
          page.drawImage(img, { x: pdfX, y: pdfY, width: p.width / scale, height: p.height / scale });
        } else {
          const font = await pdfDoc.embedFont("Helvetica" as any);
          page.drawText(p.content, {
            x: pdfX,
            y: pdfY + (p.fontSize || 14) / scale,
            size: (p.fontSize || 14),
            font,
            color: rgb(0.1, 0.1, 0.18),
          });
        }
      }

      const saved = await pdfDoc.save();
      downloadBlob(saved, `signed-${file?.name || "document.pdf"}`);
      toast("Document signed and saved!", "success");
    } catch {
      toast("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const pagePlacements = placements.filter((p) => p.page === currentPage);
  const selected = placements.find((p) => p.id === selectedId);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-4">Sign in to fill & sign documents</p>
          <a href="/auth/signin" className="px-6 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold">Sign In</a>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-2">Fill & Sign</h1>
            <p className="text-gray-500 text-lg">Fill out forms, add your signature, dates, and initials</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-[#0282e5] hover:bg-blue-50/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" aria-label="Upload PDF" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#0282e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1">Drop your PDF here</p>
            <p className="text-sm text-gray-400">or click to browse</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Signature pad modal */}
      {showSigPad && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-[#1a1a2e] mb-4">Draw your signature</h3>
            <canvas
              ref={sigCanvasRef}
              width={400}
              height={160}
              className="w-full border-2 border-gray-200 rounded-xl cursor-crosshair bg-white touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            <div className="flex items-center gap-3 mt-4">
              <button type="button" onClick={saveSig} className="flex-1 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold">Use Signature</button>
              <button type="button" onClick={clearSig} className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600">Clear</button>
              <button type="button" onClick={() => setShowSigPad(false)} className="px-4 py-2.5 rounded-lg text-sm text-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap">
        {([
          ["select", "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122", "Select"],
          ["text", "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", "Text"],
          ["signature", "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z", "Sign"],
          ["date", "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", "Date"],
          ["initials", "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", "Initials"],
        ] as const).map(([t, icon, label]) => (
          <button key={t} type="button" onClick={() => setTool(t as any)} title={label}
            className={`p-2 rounded-lg ${tool === t ? "bg-[#0282e5] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
          </button>
        ))}

        <div className="border-l border-gray-200 h-6 mx-1" />

        {/* Page nav */}
        <button type="button" title="Previous page" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}
          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-sm text-gray-600 min-w-[60px] text-center">{currentPage} / {totalPages}</span>
        <button type="button" title="Next page" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}
          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        {selected && (
          <>
            <div className="border-l border-gray-200 h-6 mx-1" />
            <button type="button" title="Delete selection" onClick={() => deletePlacement(selected.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {signatureDataUrl && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <img src={signatureDataUrl} alt="Your signature" className="h-6 border border-gray-200 rounded" />
              <button type="button" onClick={() => setShowSigPad(true)} className="hover:text-[#0282e5]">Change</button>
            </div>
          )}
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#00BB88] text-white text-sm font-bold hover:bg-[#00a87a] disabled:opacity-60">
            {saving ? "Saving..." : "Save & Download"}
          </button>
          <button type="button" onClick={() => { setFile(null); setPdfBytes(null); setPlacements([]); }}
            className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">New File</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-6">
        <div className="relative shadow-lg" style={{ width: pageSize.width || "auto", height: pageSize.height || "auto" }}>
          <canvas ref={canvasRef} onClick={handleCanvasClick}
            className={`block ${tool !== "select" ? "cursor-crosshair" : "cursor-default"}`} />
          {pagePlacements.map((p) => (
            <div key={p.id}
              onClick={(e) => { e.stopPropagation(); setSelectedId(p.id); setTool("select"); }}
              style={{ position: "absolute", left: p.x, top: p.y, width: p.width, height: p.type === "signature" ? p.height : "auto" }}
              className={`${selectedId === p.id ? "ring-2 ring-[#0282e5] ring-offset-1" : "hover:ring-1 hover:ring-blue-300"}`}>
              {p.type === "signature" ? (
                <img src={p.content} alt="Signature" className="w-full h-full object-contain" draggable={false} />
              ) : (
                <input
                  type="text"
                  value={p.content}
                  onChange={(e) => updatePlacement(p.id, { content: e.target.value })}
                  style={{ fontSize: p.fontSize, width: p.width }}
                  className="bg-blue-50/60 border-b-2 border-[#0282e5] outline-none px-1 py-0.5 text-[#1a1a2e]"
                  aria-label={`${p.type} field`}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              )}
              {selectedId === p.id && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#0282e5] rounded-sm cursor-se-resize"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startW = p.width;
                    const startH = p.height;
                    const onMove = (ev: MouseEvent) => {
                      updatePlacement(p.id, { width: Math.max(40, startW + (ev.clientX - startX)), height: Math.max(20, startH + (ev.clientY - e.clientY)) });
                    };
                    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                    window.addEventListener("mousemove", onMove);
                    window.addEventListener("mouseup", onUp);
                  }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-xs text-gray-400">
        <span>{file.name} &middot; {totalPages} pages</span>
        <span>{placements.length} field{placements.length !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}
