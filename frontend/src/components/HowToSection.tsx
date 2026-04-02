import Link from "next/link";

const guides = [
  {
    num: "01",
    title: "How to edit a PDF",
    desc: "Open your PDF, click any text to edit, change fonts, colors, and more.",
    href: "/tools/edit",
  },
  {
    num: "02",
    title: "How to merge PDFs",
    desc: "Upload multiple PDFs, drag to reorder, and download as one combined file.",
    href: "/tools/merge",
  },
  {
    num: "03",
    title: "How to split a PDF",
    desc: "Choose page ranges, split by bookmarks or file size, and download instantly.",
    href: "/tools/split",
  },
  {
    num: "04",
    title: "How to compress a PDF",
    desc: "Upload your PDF, choose compression level, reduce file size in seconds.",
    href: "/tools/compress",
  },
  {
    num: "05",
    title: "How to convert PDF to Word",
    desc: "Upload your PDF and get an editable .docx file with formatting preserved.",
    href: "/tools/pdf-to-word",
  },
  {
    num: "06",
    title: "How to sign a PDF",
    desc: "Draw, type, or upload your signature and place it anywhere on the document.",
    href: "/tools/fill-sign",
  },
];

export default function HowToSection() {
  return (
    <section className="py-16 md:py-20 bg-[#ebf5fe]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] text-center mb-2">
          How-to Guides
        </h2>
        <p className="text-center text-gray-500 mb-10">
          Step-by-step instructions for the most common PDF tasks
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {guides.map((g) => (
            <Link
              key={g.num}
              href={g.href}
              className="block bg-white rounded-xl p-6 border border-[#d4e8f8] hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <div className="text-2xl font-extrabold text-[#c8ddf4] mb-2">
                {g.num}
              </div>
              <h4 className="text-[15.5px] font-bold text-[#1a1a2e] mb-1.5">
                {g.title}
              </h4>
              <p className="text-[13.5px] text-gray-500 leading-relaxed">
                {g.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
