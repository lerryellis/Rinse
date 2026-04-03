import ToolPage from "@/components/ToolPage";
import PdfEditor from "@/components/PdfEditor";
import FillAndSign from "@/components/FillAndSign";

const toolMeta: Record<string, { title: string; description: string; side: "client" | "server" }> = {
  edit: { title: "PDF Editor", description: "Edit text, images, and links in your PDF", side: "client" },
  "fill-sign": { title: "Fill & Sign", description: "Fill out forms and sign PDF documents", side: "client" },
  forms: { title: "PDF Forms", description: "Create fillable PDF forms", side: "client" },
  watermark: { title: "Add Watermark", description: "Stamp text or image watermarks on your PDF", side: "server" },
  bates: { title: "Bates Numbering", description: "Add Bates stamps to your PDF pages", side: "server" },
  merge: { title: "Merge PDFs", description: "Combine multiple PDF files into one", side: "client" },
  split: { title: "Split PDF", description: "Split a PDF into separate pages or sections", side: "client" },
  organize: { title: "Organize Pages", description: "Reorder, rotate, and delete pages in your PDF", side: "client" },
  extract: { title: "Extract Pages", description: "Pull specific pages from your PDF", side: "client" },
  "delete-pages": { title: "Delete Pages", description: "Remove unwanted pages from your PDF", side: "client" },
  alternate: { title: "Alternate & Mix", description: "Interleave pages from two PDF files", side: "client" },
  "pdf-to-word": { title: "PDF to Word", description: "Convert your PDF to an editable .docx file", side: "server" },
  "pdf-to-excel": { title: "PDF to Excel", description: "Extract tables from your PDF into .xlsx", side: "server" },
  "pdf-to-jpg": { title: "PDF to JPG", description: "Save PDF pages as high-quality images", side: "server" },
  "pdf-to-pptx": { title: "PDF to PowerPoint", description: "Convert your PDF to a .pptx presentation", side: "server" },
  "pdf-to-text": { title: "PDF to Text", description: "Extract all text content from your PDF", side: "server" },
  "word-to-pdf": { title: "Word to PDF", description: "Convert a .docx document to PDF", side: "server" },
  ocr: { title: "OCR PDF", description: "Make scanned PDFs searchable with optical character recognition", side: "server" },
  compress: { title: "Compress PDF", description: "Reduce your PDF file size", side: "server" },
  crop: { title: "Crop PDF", description: "Trim the margins of your PDF pages", side: "server" },
  rotate: { title: "Rotate PDF", description: "Rotate PDF pages in any direction", side: "client" },
  protect: { title: "Protect PDF", description: "Add a password to protect your PDF", side: "server" },
  unlock: { title: "Unlock PDF", description: "Remove the password from a protected PDF", side: "server" },
  "html-to-pdf": { title: "HTML to PDF", description: "Convert HTML content or a webpage URL to a PDF document", side: "server" },
};

export async function generateStaticParams() {
  return Object.keys(toolMeta).map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const meta = toolMeta[tool];
  if (!meta) return { title: "Tool Not Found" };
  return {
    title: `${meta.title} — Rinse`,
    description: meta.description,
  };
}

export default async function Page({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const meta = toolMeta[tool];

  if (!meta) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tool Not Found</h1>
          <p className="text-gray-500">The requested tool does not exist.</p>
        </div>
      </div>
    );
  }

  if (tool === "edit") return <PdfEditor />;
  if (tool === "fill-sign") return <FillAndSign />;
  return <ToolPage slug={tool} title={meta.title} description={meta.description} side={meta.side} />;
}
