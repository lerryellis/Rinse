"use client";

import Link from "next/link";

interface Tool {
  name: string;
  desc: string;
  href: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const editTools: Tool[] = [
  {
    name: "PDF Editor",
    desc: "Edit text, images, links",
    href: "/tools/edit",
    color: "#0282e5",
    bgColor: "#ebf5fe",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#ebf5fe" />
        <path d="M12 28l4-1 10-10-3-3-10 10-1 4zm14-14l2-2a1.4 1.4 0 000-2l-1-1a1.4 1.4 0 00-2 0l-2 2 3 3z" fill="#0282e5" />
      </svg>
    ),
  },
  {
    name: "Fill & Sign",
    desc: "Fill forms & sign documents",
    href: "/tools/fill-sign",
    color: "#0282e5",
    bgColor: "#ebf5fe",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#ebf5fe" />
        <path d="M14 20h12M14 25h8M20 10h-7a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V18l-9-8z" stroke="#0282e5" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "PDF Forms",
    desc: "Create fillable PDF forms",
    href: "/tools/forms",
    color: "#0282e5",
    bgColor: "#ebf5fe",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#ebf5fe" />
        <rect x="11" y="12" width="18" height="4" rx="2" fill="#0282e5" />
        <rect x="11" y="20" width="18" height="4" rx="2" fill="#41a1f0" />
        <rect x="11" y="28" width="12" height="2" rx="1" fill="#b0cfee" />
      </svg>
    ),
  },
  {
    name: "Add Watermark",
    desc: "Stamp text or image",
    href: "/tools/watermark",
    color: "#0282e5",
    bgColor: "#ebf5fe",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#ebf5fe" />
        <text x="9" y="28" fontFamily="serif" fontSize="20" fill="#0282e5" opacity=".25">A</text>
        <text x="14" y="27" fontFamily="serif" fontSize="14" fill="#0282e5">W</text>
      </svg>
    ),
  },
  {
    name: "Bates Numbering",
    desc: "Add Bates stamps to PDFs",
    href: "/tools/bates",
    color: "#0282e5",
    bgColor: "#ebf5fe",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#ebf5fe" />
        <text x="8" y="27" fontFamily="monospace" fontSize="11" fill="#0282e5">B-001</text>
      </svg>
    ),
  },
];

const organizeTools: Tool[] = [
  {
    name: "Merge PDFs",
    desc: "Combine multiple PDFs",
    href: "/tools/merge",
    color: "#00BB88",
    bgColor: "#e9f9f0",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#e9f9f0" />
        <rect x="11" y="14" width="7" height="10" rx="2" fill="#00BB88" />
        <rect x="22" y="14" width="7" height="10" rx="2" fill="#00BB88" opacity=".5" />
        <path d="M18 19h4" stroke="#00BB88" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Split PDF",
    desc: "Split into separate pages",
    href: "/tools/split",
    color: "#00BB88",
    bgColor: "#e9f9f0",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#e9f9f0" />
        <rect x="14" y="12" width="12" height="16" rx="2" fill="#00BB88" opacity=".3" />
        <path d="M20 16v8M16 21l4 4 4-4" stroke="#00BB88" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Organize Pages",
    desc: "Reorder, rotate, delete pages",
    href: "/tools/organize",
    color: "#00BB88",
    bgColor: "#e9f9f0",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#e9f9f0" />
        <rect x="10" y="14" width="6" height="8" rx="1" fill="#00BB88" />
        <rect x="22" y="14" width="6" height="8" rx="1" fill="#00BB88" opacity=".5" />
        <path d="M18 18h4M21 16l2 2-2 2" stroke="#00BB88" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Extract Pages",
    desc: "Pull specific pages out",
    href: "/tools/extract",
    color: "#00BB88",
    bgColor: "#e9f9f0",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#e9f9f0" />
        <rect x="14" y="12" width="12" height="16" rx="2" fill="#00BB88" opacity=".2" />
        <rect x="17" y="16" width="6" height="8" rx="1" fill="#00BB88" />
      </svg>
    ),
  },
  {
    name: "Delete Pages",
    desc: "Remove unwanted pages",
    href: "/tools/delete-pages",
    color: "#00BB88",
    bgColor: "#e9f9f0",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#e9f9f0" />
        <rect x="14" y="12" width="12" height="16" rx="2" fill="#00BB88" opacity=".2" />
        <path d="M16 20h8M19 17l-3 3 3 3" stroke="#00BB88" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Alternate & Mix",
    desc: "Interleave two PDFs",
    href: "/tools/alternate",
    color: "#00BB88",
    bgColor: "#e9f9f0",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#e9f9f0" />
        <rect x="10" y="14" width="8" height="10" rx="2" fill="#00BB88" />
        <rect x="22" y="14" width="8" height="10" rx="2" fill="#00BB88" opacity=".5" />
        <path d="M18 17l4 5M22 17l-4 5" stroke="white" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const convertTools: Tool[] = [
  {
    name: "PDF to Word",
    desc: "Convert to editable .docx",
    href: "/tools/pdf-to-word",
    color: "#e96e00",
    bgColor: "#fff2eb",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#fff2eb" />
        <rect x="11" y="12" width="8" height="12" rx="2" fill="#e96e00" opacity=".7" />
        <rect x="21" y="16" width="8" height="12" rx="2" fill="#e96e00" opacity=".4" />
        <text x="22" y="25" fontFamily="sans-serif" fontSize="6" fontWeight="700" fill="#e96e00">W</text>
      </svg>
    ),
  },
  {
    name: "PDF to Excel",
    desc: "Extract tables to .xlsx",
    href: "/tools/pdf-to-excel",
    color: "#e96e00",
    bgColor: "#fff2eb",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#fff2eb" />
        <rect x="11" y="12" width="18" height="16" rx="2" fill="#e96e00" opacity=".2" />
        <path d="M14 17h12M14 21h12M14 25h8" stroke="#e96e00" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "PDF to JPG",
    desc: "Save pages as images",
    href: "/tools/pdf-to-jpg",
    color: "#e96e00",
    bgColor: "#fff2eb",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#fff2eb" />
        <rect x="12" y="11" width="16" height="18" rx="2" fill="#e96e00" opacity=".25" />
        <circle cx="20" cy="20" r="5" fill="#e96e00" opacity=".6" />
      </svg>
    ),
  },
  {
    name: "PDF to PowerPoint",
    desc: "Convert to .pptx slides",
    href: "/tools/pdf-to-pptx",
    color: "#e96e00",
    bgColor: "#fff2eb",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#fff2eb" />
        <rect x="11" y="12" width="8" height="12" rx="2" fill="#e96e00" opacity=".5" />
        <rect x="21" y="16" width="8" height="12" rx="2" fill="#e96e00" opacity=".3" />
        <text x="22" y="25" fontFamily="sans-serif" fontSize="6" fontWeight="700" fill="#e96e00">P</text>
      </svg>
    ),
  },
  {
    name: "PDF to Text",
    desc: "Extract all text content",
    href: "/tools/pdf-to-text",
    color: "#e96e00",
    bgColor: "#fff2eb",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#fff2eb" />
        <path d="M13 15h14M13 19h14M13 23h10" stroke="#e96e00" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Word to PDF",
    desc: "Convert .docx to PDF",
    href: "/tools/word-to-pdf",
    color: "#e96e00",
    bgColor: "#fff2eb",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#fff2eb" />
        <rect x="11" y="12" width="8" height="12" rx="2" fill="#e96e00" opacity=".4" />
        <path d="M22 18h6M22 22h6" stroke="#e96e00" strokeWidth="1.5" strokeLinecap="round" />
        <text x="12" y="23" fontFamily="sans-serif" fontSize="7" fontWeight="700" fill="#e96e00">W</text>
      </svg>
    ),
  },
  {
    name: "OCR PDF",
    desc: "Make scanned PDFs searchable",
    href: "/tools/ocr",
    color: "#e96e00",
    bgColor: "#fff2eb",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#fff2eb" />
        <text x="8" y="26" fontFamily="serif" fontWeight="700" fontSize="16" fill="#e96e00" opacity=".8">OCR</text>
      </svg>
    ),
  },
  {
    name: "HTML to PDF",
    desc: "Convert webpage or HTML to PDF",
    href: "/tools/html-to-pdf",
    color: "#e96e00",
    bgColor: "#fff2eb",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#fff2eb" />
        <text x="6" y="17" fontFamily="monospace" fontSize="7" fill="#e96e00" opacity=".6">&lt;/&gt;</text>
        <rect x="20" y="16" width="9" height="12" rx="2" fill="#e96e00" opacity=".5" />
        <path d="M14 22l4-2-4-2" stroke="#e96e00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const optimizeTools: Tool[] = [
  {
    name: "Compress PDF",
    desc: "Reduce file size",
    href: "/tools/compress",
    color: "#7c5cfc",
    bgColor: "#f3eeff",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#f3eeff" />
        <path d="M20 12l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8v-6l7-4z" fill="#7c5cfc" opacity=".2" stroke="#7c5cfc" strokeWidth="1.5" />
        <path d="M17 20l2 2 4-4" stroke="#7c5cfc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Crop PDF",
    desc: "Trim page margins",
    href: "/tools/crop",
    color: "#7c5cfc",
    bgColor: "#f3eeff",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#f3eeff" />
        <rect x="12" y="12" width="16" height="16" rx="2" fill="none" stroke="#7c5cfc" strokeWidth="1.5" strokeDasharray="3 2" />
        <rect x="15" y="15" width="10" height="10" rx="1" fill="#7c5cfc" opacity=".3" />
      </svg>
    ),
  },
  {
    name: "Rotate PDF",
    desc: "Rotate pages any direction",
    href: "/tools/rotate",
    color: "#7c5cfc",
    bgColor: "#f3eeff",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#f3eeff" />
        <path d="M20 12v16M14 18l6-6 6 6" stroke="#7c5cfc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 26h12" stroke="#7c5cfc" strokeWidth="1.8" strokeLinecap="round" opacity=".4" />
      </svg>
    ),
  },
  {
    name: "Protect PDF",
    desc: "Password protect your PDF",
    href: "/tools/protect",
    color: "#7c5cfc",
    bgColor: "#f3eeff",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#f3eeff" />
        <rect x="15" y="19" width="10" height="9" rx="2" fill="#7c5cfc" opacity=".3" stroke="#7c5cfc" strokeWidth="1.5" />
        <path d="M17 19v-3a3 3 0 016 0v3" stroke="#7c5cfc" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Unlock PDF",
    desc: "Remove PDF password",
    href: "/tools/unlock",
    color: "#7c5cfc",
    bgColor: "#f3eeff",
    icon: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="8" fill="#f3eeff" />
        <rect x="15" y="19" width="10" height="9" rx="2" fill="none" stroke="#7c5cfc" strokeWidth="1.5" />
        <path d="M17 19v-2a3 3 0 015.8-1" stroke="#7c5cfc" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="16" r="2" fill="#7c5cfc" opacity=".5" />
      </svg>
    ),
  },
];

const categories = [
  { label: "Edit & Sign", tools: editTools },
  { label: "Organize Pages", tools: organizeTools },
  { label: "Convert", tools: convertTools },
  { label: "Optimize & Secure", tools: optimizeTools },
];

export default function ToolsGrid() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] text-center mb-2">
          All PDF Tools
        </h2>

        {categories.map((cat) => (
          <div key={cat.label} className="mt-12">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-gray-400 mb-4 pb-2 border-b-2 border-gray-100">
              {cat.label}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {cat.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex flex-col items-center text-center p-5 rounded-xl border border-gray-200 bg-white hover:-translate-y-1 hover:shadow-lg hover:border-[#c8d8ee] transition-all"
                >
                  <div className="w-12 h-12 mb-2.5">{tool.icon}</div>
                  <span className="text-[13.5px] font-semibold text-gray-800 mb-1">
                    {tool.name}
                  </span>
                  <span className="text-[11.5px] text-gray-400 leading-snug">
                    {tool.desc}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
