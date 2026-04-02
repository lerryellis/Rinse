import { PDFDocument } from "pdf-lib";

export async function deletePages(
  file: File,
  pageNumbers: number[] // 1-indexed page numbers to delete
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const source = await PDFDocument.load(bytes);
  const totalPages = source.getPageCount();

  const toDelete = new Set(pageNumbers.map((n) => n - 1)); // convert to 0-indexed
  const keepIndices = [];
  for (let i = 0; i < totalPages; i++) {
    if (!toDelete.has(i)) keepIndices.push(i);
  }

  if (keepIndices.length === 0) {
    throw new Error("Cannot delete all pages");
  }

  const result = await PDFDocument.create();
  const pages = await result.copyPages(source, keepIndices);
  pages.forEach((page) => result.addPage(page));

  return result.save();
}
