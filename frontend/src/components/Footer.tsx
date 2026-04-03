import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { name: "PDF Editor", href: "/tools/edit" },
      { name: "Pricing", href: "/pricing" },
      { name: "Blog", href: "/blog" },
      { name: "Team", href: "/team" },
    ],
  },
  {
    title: "Tools",
    links: [
      { name: "Merge PDFs", href: "/tools/merge" },
      { name: "Split PDF", href: "/tools/split" },
      { name: "Compress PDF", href: "/tools/compress" },
      { name: "PDF to Word", href: "/tools/pdf-to-word" },
      { name: "PDF to Excel", href: "/tools/pdf-to-excel" },
      { name: "PDF to JPG", href: "/tools/pdf-to-jpg" },
      { name: "OCR PDF", href: "/tools/ocr" },
    ],
  },
  {
    title: "Developers",
    links: [
      { name: "Developer API", href: "/developers" },
      { name: "Documentation", href: "/developers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Terms of Service", href: "/legal/terms" },
      { name: "Privacy Policy", href: "/legal/privacy" },
      { name: "Cookies Policy", href: "/legal/cookies" },
      { name: "Security", href: "/legal/security" },
      { name: "SLA", href: "/legal/sla" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-[#b0b8cc] pt-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_0.8fr_1fr] gap-8 pb-12 border-b border-[#2e3148]">
          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-[#00BB88] flex items-center justify-center">
                <span className="text-white font-bold text-xs">R</span>
              </div>
              <span className="text-base font-bold text-white">rinse</span>
            </Link>
            <p className="text-[13px] text-[#8890aa] leading-relaxed mb-3">
              Productivity tools
              <br />
              for your PDFs
            </p>
            <p className="text-[13px] text-[#0282e5] font-medium">
              hi@rinse.dev
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#e0e4f0] mb-3.5">
                {col.title}
              </h5>
              {col.links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-[13.5px] text-[#8890aa] py-1 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between py-5 text-[12.5px] text-[#5a6278]">
          <span>&copy; 2025&ndash;2026 Rinse &middot; All rights reserved</span>
          <select className="bg-[#252840] border border-[#3a3f5c] text-[#9aa0b8] px-2.5 py-1 rounded-md text-[12.5px] cursor-pointer">
            <option>English</option>
            <option>Espa&ntilde;ol</option>
            <option>Fran&ccedil;ais</option>
            <option>Deutsch</option>
          </select>
        </div>
      </div>
    </footer>
  );
}
