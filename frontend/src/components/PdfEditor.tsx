"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";

interface Annotation {
  id: string;
  type: "text" | "image";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  color?: string;
  imageData?: string;
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

export default function PdfEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "image">("select");
  const [saving, setSaving] = useState(false);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [renderError, setRenderError] = useState<string | null>(null);
  const [pdfWorkerReady, setPdfWorkerReady] = useState(false);

  // Initialize PDF.js worker once
  useEffect(() => {
    import("pdfjs-dist").then((pdfjsLib) => {
      // Worker served from /public — guaranteed to match installed version
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      setPdfWorkerReady(true);
    }).catch((err) => {
      console.error("Failed to load PDF.js:", err);
      setRenderError("Failed to load PDF renderer. Please refresh the page.");
    });
  }, []);

  // Render the current page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfBytes || !canvasRef.current || !pdfWorkerReady) return;
    setRenderError(null);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      const dataCopy = pdfBytes.slice(0);
      const pdf = await pdfjsLib.getDocument({ data: dataCopy }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setPageSize({ width: viewport.width, height: viewport.height });

      // PDF.js v5: use canvas parameter (preferred), fallback to canvasContext
      const renderTask = page.render({
        canvas,
        viewport,
      } as any);
      await renderTask.promise;
    } catch (err) {
      console.error("PDF render error:", err);
      // Retry with canvasContext fallback for older browser support
      try {
        const pdfjsLib = await import("pdfjs-dist");
        const dataCopy = pdfBytes.slice(0);
        const pdf = await pdfjsLib.getDocument({ data: dataCopy }).promise;
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setPageSize({ width: viewport.width, height: viewport.height });
        await page.render({ canvasContext: ctx, viewport } as any).promise;
      } catch (retryErr) {
        console.error("PDF render retry failed:", retryErr);
        setRenderError(`Failed to render page ${pageNum}. Error: ${retryErr instanceof Error ? retryErr.message : "Unknown error"}`);
      }
    }
  }, [pdfBytes, scale, pdfWorkerReady]);

  useEffect(() => {
    if (pdfBytes && pdfWorkerReady) renderPage(currentPage);
  }, [pdfBytes, currentPage, scale, renderPage, pdfWorkerReady]);

  const handleFileUpload = async (f: File) => {
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      setPdfBytes(bytes);
      setFile(f);
      setAnnotations([]);
      setCurrentPage(1);
      setRenderError(null);

      const pdfjsLib = await import("pdfjs-dist");
      const pdf = await pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
      setTotalPages(pdf.numPages);
    } catch (err) {
      console.error("Failed to load PDF:", err);
      toast("Failed to load PDF. The file may be corrupted or password-protected.", "error");
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool === "select") {
      setSelectedId(null);
      return;
    }
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "text") {
      const id = `ann-${Date.now()}`;
      setAnnotations((prev) => [
        ...prev,
        { id, type: "text", page: currentPage, x, y, width: 200, height: 30, content: "Edit text here", fontSize: 16, color: "#000000" },
      ]);
      setSelectedId(id);
      setActiveTool("select");
    } else if (activeTool === "image") {
      imageInputRef.current?.click();
      (window as any).__rinseImagePos = { x, y };
    }
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      const pos = (window as any).__rinseImagePos || { x: 100, y: 100 };
      const id = `ann-${Date.now()}`;
      setAnnotations((prev) => [
        ...prev,
        { id, type: "image", page: currentPage, x: pos.x, y: pos.y, width: 150, height: 150, content: imgFile.name, imageData: reader.result as string },
      ]);
      setSelectedId(id);
      setActiveTool("select");
    };
    reader.readAsDataURL(imgFile);
    e.target.value = "";
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    setSelectedId(null);
  };

  const handleSave = async () => {
    if (!pdfBytes) return;
    setSaving(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const ann of annotations) {
        const page = pdfDoc.getPage(ann.page - 1);
        const { height: pageHeight } = page.getSize();
        const pdfX = ann.x / scale;
        const pdfY = pageHeight - (ann.y / scale) - (ann.height / scale);

        if (ann.type === "text") {
          const colorHex = ann.color || "#000000";
          const r = parseInt(colorHex.slice(1, 3), 16) / 255;
          const g = parseInt(colorHex.slice(3, 5), 16) / 255;
          const b = parseInt(colorHex.slice(5, 7), 16) / 255;
          page.drawText(ann.content, {
            x: pdfX, y: pdfY,
            size: (ann.fontSize || 16),
            font: helvetica,
            color: rgb(r, g, b),
          });
        } else if (ann.type === "image" && ann.imageData) {
          try {
            let img;
            if (ann.imageData.includes("image/png")) {
              img = await pdfDoc.embedPng(ann.imageData);
            } else {
              img = await pdfDoc.embedJpg(ann.imageData);
            }
            page.drawImage(img, {
              x: pdfX, y: pdfY,
              width: ann.width / scale,
              height: ann.height / scale,
            });
          } catch {
            console.warn("Failed to embed image:", ann.content);
          }
        }
      }

      const saved = await pdfDoc.save();
      downloadBlob(saved, `edited-${file?.name || "document.pdf"}`);
      toast("PDF saved with edits!", "success");
    } catch (err) {
      console.error("Save error:", err);
      toast("Failed to save PDF. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const selected = annotations.find((a) => a.id === selectedId);
  const pageAnnotations = annotations.filter((a) => a.page === currentPage);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-4">Sign in to edit PDFs</p>
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
            <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-2">PDF Editor</h1>
            <p className="text-gray-500 text-lg">Add text, images, and annotations to your PDF</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div
            className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-[#0282e5] hover:bg-blue-50/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); }}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" aria-label="Upload PDF to edit" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
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
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 border-r border-gray-200 pr-3 mr-1">
          {([
            { id: "select", icon: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5", label: "Select" },
            { id: "text", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", label: "Add Text" },
            { id: "image", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Add Image" },
          ] as const).map((t) => (
            <button key={t.id} type="button" title={t.label} onClick={() => setActiveTool(t.id as any)}
              className={`p-2 rounded-lg text-sm ${activeTool === t.id ? "bg-[#0282e5] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
            </button>
          ))}
        </div>

        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" aria-label="Upload image" onChange={handleImageSelected} />

        {/* Page nav */}
        <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-1">
          <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">{currentPage} / {totalPages}</span>
          <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 border-r border-gray-200 pr-3 mr-1">
          <button type="button" title="Zoom out" onClick={() => setScale((s) => Math.max(0.5, s - 0.2))} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 text-xs font-bold">-</button>
          <span className="text-xs text-gray-500 min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
          <button type="button" title="Zoom in" onClick={() => setScale((s) => Math.min(3, s + 0.2))} className="p-1.5 rounded text-gray-500 hover:bg-gray-100 text-xs font-bold">+</button>
        </div>

        {/* Selected text props */}
        {selected?.type === "text" && (
          <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-1">
            <input type="number" value={selected.fontSize || 16} min={8} max={72}
              onChange={(e) => updateAnnotation(selected.id, { fontSize: Number(e.target.value) })}
              className="w-14 px-2 py-1 rounded border border-gray-200 text-xs" aria-label="Font size" />
            <input type="color" value={selected.color || "#000000"}
              onChange={(e) => updateAnnotation(selected.id, { color: e.target.value })}
              className="w-7 h-7 rounded border border-gray-200 cursor-pointer" aria-label="Text color" />
          </div>
        )}

        {selected && (
          <button type="button" onClick={() => deleteAnnotation(selected.id)}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 text-sm" title="Delete">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#00BB88] text-white text-sm font-bold hover:bg-[#00a87a] disabled:opacity-60 transition-colors">
            {saving ? "Saving..." : "Save & Download"}
          </button>
          <button type="button" onClick={() => { setFile(null); setPdfBytes(null); setAnnotations([]); setRenderError(null); }}
            className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">New File</button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-6">
        {renderError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md">
            <p className="text-red-600 font-medium mb-2">Render Error</p>
            <p className="text-sm text-red-500">{renderError}</p>
            <button type="button" onClick={() => renderPage(currentPage)} className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold">Retry</button>
          </div>
        ) : (
          <div className="relative shadow-lg bg-white" style={{ width: pageSize.width || "auto", height: pageSize.height || "auto" }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className={`block ${activeTool === "text" ? "cursor-text" : activeTool === "image" ? "cursor-crosshair" : "cursor-default"}`}
            />

            {/* Annotation overlays */}
            {pageAnnotations.map((ann) => (
              <div
                key={ann.id}
                onClick={(e) => { e.stopPropagation(); setSelectedId(ann.id); setActiveTool("select"); }}
                onMouseDown={(e) => {
                  if (selectedId !== ann.id) return;
                  e.stopPropagation();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startAnnX = ann.x;
                  const startAnnY = ann.y;
                  const onMove = (ev: MouseEvent) => {
                    updateAnnotation(ann.id, {
                      x: startAnnX + (ev.clientX - startX),
                      y: startAnnY + (ev.clientY - startY),
                    });
                  };
                  const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                  window.addEventListener("mousemove", onMove);
                  window.addEventListener("mouseup", onUp);
                }}
                style={{
                  position: "absolute",
                  left: ann.x,
                  top: ann.y,
                  width: ann.width,
                  height: ann.type === "text" ? "auto" : ann.height,
                  minHeight: 20,
                  cursor: selectedId === ann.id ? "move" : "pointer",
                }}
                className={`${selectedId === ann.id ? "ring-2 ring-[#0282e5] ring-offset-1" : "hover:ring-1 hover:ring-blue-300"}`}
              >
                {ann.type === "text" ? (
                  <textarea
                    value={ann.content}
                    onChange={(e) => updateAnnotation(ann.id, { content: e.target.value })}
                    style={{ fontSize: ann.fontSize, color: ann.color, width: ann.width }}
                    className="bg-transparent border-none outline-none resize-both overflow-hidden p-0 m-0 leading-tight"
                    aria-label="Text annotation"
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                ) : ann.imageData ? (
                  <img src={ann.imageData} alt={ann.content} className="w-full h-full object-contain pointer-events-none" draggable={false} />
                ) : null}

                {/* Resize handle */}
                {selectedId === ann.id && (
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#0282e5] rounded-sm cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startW = ann.width;
                      const startH = ann.height;
                      const onMove = (ev: MouseEvent) => {
                        updateAnnotation(ann.id, {
                          width: Math.max(40, startW + (ev.clientX - startX)),
                          height: Math.max(20, startH + (ev.clientY - startY)),
                        });
                      };
                      const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                      window.addEventListener("mousemove", onMove);
                      window.addEventListener("mouseup", onUp);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-xs text-gray-400">
        <span>{file.name} &middot; {totalPages} pages</span>
        <span>{annotations.length} annotation{annotations.length !== 1 ? "s" : ""} &middot; {activeTool === "text" ? "Click to add text" : activeTool === "image" ? "Click to place image" : "Select annotations"}</span>
      </div>
    </div>
  );
}
