import { PDFDocument } from "pdf-lib";

export interface SplitOptions {
  mode: "each" | "ranges";
  ranges?: string; // e.g. "1-3, 5, 7-10"
}

/**
 * Split a PDF into multiple files.
 * - "each" mode: one file per page
 * - "ranges" mode: one file per specified range
 */
export async function splitPdf(
  file: File,
  options: SplitOptions
): Promise<{ name: string; data: Uint8Array }[]> {
  const bytes = await file.arrayBuffer();
  const source = await PDFDocument.load(bytes);
  const totalPages = source.getPageCount();
  const results: { name: string; data: Uint8Array }[] = [];

  if (options.mode === "each") {
    for (let i = 0; i < totalPages; i++) {
      const doc = await PDFDocument.create();
      const [page] = await doc.copyPages(source, [i]);
      doc.addPage(page);
      results.push({
        name: `page-${i + 1}.pdf`,
        data: await doc.save(),
      });
    }
  } else {
    const parsed = parseRanges(options.ranges || "", totalPages);
    for (const range of parsed) {
      const doc = await PDFDocument.create();
      const indices = [];
      for (let i = range.start; i <= range.end; i++) {
        indices.push(i - 1); // 0-indexed
      }
      const pages = await doc.copyPages(source, indices);
      pages.forEach((page) => doc.addPage(page));
      results.push({
        name: `pages-${range.start}-${range.end}.pdf`,
        data: await doc.save(),
      });
    }
  }

  return results;
}

function parseRanges(
  input: string,
  max: number
): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      if (!isNaN(a) && !isNaN(b) && a >= 1 && b <= max && a <= b) {
        ranges.push({ start: a, end: b });
      }
    } else {
      const n = Number(part);
      if (!isNaN(n) && n >= 1 && n <= max) {
        ranges.push({ start: n, end: n });
      }
    }
  }

  return ranges;
}

export async function getPageCount(file: File): Promise<number> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  return pdf.getPageCount();
}
