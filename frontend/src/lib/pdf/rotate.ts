import { PDFDocument, degrees } from "pdf-lib";

export type RotationAngle = 90 | 180 | 270;

export async function rotatePdf(
  file: File,
  angle: RotationAngle,
  pageIndices?: number[] // if undefined, rotate all pages
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdf = await PDFDocument.load(bytes);
  const pages = pdf.getPages();

  const targets = pageIndices ?? pages.map((_, i) => i);

  for (const i of targets) {
    if (i >= 0 && i < pages.length) {
      const current = pages[i].getRotation().angle;
      pages[i].setRotation(degrees(current + angle));
    }
  }

  return pdf.save();
}
