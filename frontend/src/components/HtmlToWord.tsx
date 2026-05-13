"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

type Mode = "url" | "code" | "file";

export default function HtmlToWord() {
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>("code");
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [filename, setFilename] = useState("document.docx");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function readHtmlFromFile(): Promise<string> {
    const f = fileRef.current?.files?.[0];
    if (!f) throw new Error("Choose an HTML file first.");
    return await f.text();
  }

  function safeUrl(input: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(input);
    } catch {
      throw new Error("Enter a valid URL (including https://).");
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("Only http and https URLs are allowed.");
    }
    return parsed;
  }

  async function fetchHtmlFromUrl(input: string): Promise<string> {
    const parsed = safeUrl(input);
    if (!session?.access_token) {
      throw new Error("Sign in to fetch a URL, or paste the HTML directly.");
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiUrl}/api/pdf/fetch-html`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ url: parsed.toString() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || "Could not fetch that URL. Try pasting the HTML instead.");
    }
    const data = (await res.json()) as { html: string };
    return data.html;
  }

  async function convert() {
    setError(null);
    setBusy(true);
    try {
      let html = "";
      if (mode === "code") {
        if (!code.trim()) throw new Error("Paste some HTML first.");
        html = code;
      } else if (mode === "url") {
        if (!url.trim()) throw new Error("Enter a URL first.");
        html = await fetchHtmlFromUrl(url);
      } else {
        html = await readHtmlFromFile();
      }

      const mod = await import("@turbodocx/html-to-docx");
      type Converter = (
        html: string,
        header: string | null,
        opts: Record<string, unknown>,
        footer: string | null,
      ) => Promise<ArrayBuffer | Blob>;
      const HtmlToDocx = (mod as unknown as { default: Converter }).default ?? (mod as unknown as Converter);

      const result = await HtmlToDocx(
        html,
        null,
        {
          orientation,
          pageNumber: false,
          font: "Calibri",
          fontSize: 22,
          margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
        null,
      );

      const blob =
        result instanceof Blob
          ? result
          : new Blob([result], {
              type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename.endsWith(".docx") ? filename : `${filename}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">HTML to Word</h1>
        <p className="text-gray-600">Convert HTML content, a webpage URL, or an .html file into an editable .docx — runs entirely in your browser.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(["code", "url", "file"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                mode === m
                  ? "border-[#0282e5] text-[#0282e5]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {m === "code" ? "Paste HTML" : m === "url" ? "From URL" : "Upload .html"}
            </button>
          ))}
        </div>

        {mode === "code" && (
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="<h1>Hello world</h1><p>Paste your HTML here…</p>"
            className="w-full h-56 px-3 py-2 font-mono text-sm rounded-md border border-gray-300 focus:border-[#0282e5] focus:ring-1 focus:ring-[#0282e5] outline-none"
          />
        )}

        {mode === "url" && (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-[#0282e5] focus:ring-1 focus:ring-[#0282e5] outline-none"
          />
        )}

        {mode === "file" && (
          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Choose an HTML file</span>
            <input
              ref={fileRef}
              type="file"
              accept=".html,.htm"
              title="Select an HTML file"
              className="block w-full text-sm text-gray-600"
            />
          </label>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6">
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">Filename</span>
            <input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300"
            />
          </label>
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">Orientation</span>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape")}
              className="w-full px-3 py-2 rounded-md border border-gray-300"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>
        </div>

        {error && (
          <div className="mt-4 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={convert}
          disabled={busy}
          className="mt-6 w-full px-4 py-2.5 rounded-md bg-[#0282e5] text-white font-semibold hover:bg-[#0170c9] disabled:opacity-50 transition-colors"
        >
          {busy ? "Converting…" : "Convert to Word"}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Files are processed locally — nothing is uploaded.
      </p>
    </div>
  );
}
