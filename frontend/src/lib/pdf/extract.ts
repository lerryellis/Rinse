import { PDFDocument } from "pdf-lib";

export async function extractPages(
  file: File,
  pageNumbers: number[] // 1-indexed
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const source = await PDFDocument.load(bytes);

  const indices = pageNumbers.map((n) => n - 1); // 0-indexed
  const result = await PDFDocument.create();
  const pages = await result.copyPages(source, indices);
  pages.forEach((page) => result.addPage(page));

  return result.save();
}
