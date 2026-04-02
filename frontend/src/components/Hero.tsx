import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white to-[#e4e9f1] py-20 md:py-24 text-center">
      {/* Polka dots */}
      <div
        className="absolute top-0 -left-10 w-[200px] h-full opacity-40 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #c4d4e8 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div
        className="absolute top-0 -right-10 w-[200px] h-full opacity-40 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #c4d4e8 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        <h1 className="text-3xl md:text-5xl font-bold text-[#1a1a2e] leading-tight mb-4">
          Productivity tools for your PDFs
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          Simple, easy to use, and free online PDF tools &mdash; no installation
          required
        </p>
        <Link
          href="/tools/edit"
          className="inline-block px-9 py-4 rounded-xl bg-[#0282e5] text-white text-[17px] font-bold shadow-[0_6px_24px_rgba(2,130,229,.32)] hover:bg-[#0170c9] hover:shadow-[0_10px_32px_rgba(2,130,229,.4)] hover:scale-[1.045] transition-all"
        >
          Edit a PDF document &ndash; it&apos;s free
        </Link>
        <p className="mt-5 text-[13px] text-gray-400">
          No registration needed &middot; Files deleted after 2 hours &middot;
          Secure &amp; private
        </p>
      </div>
    </section>
  );
}
