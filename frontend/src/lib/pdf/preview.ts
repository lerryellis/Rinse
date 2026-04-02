/**
 * Generate a thumbnail preview of the first page of a PDF.
 * Returns a data URL (image/png) or null if it fails.
 */
export async function generatePdfThumbnail(file: File): Promise<string | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const scale = 0.5;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
