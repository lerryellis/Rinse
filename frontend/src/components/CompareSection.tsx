import Link from "next/link";

export default function CompareSection() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1a1a2e] text-center mb-2">
          Rinse Web vs. Rinse Desktop
        </h2>
        <p className="text-center text-gray-500 mb-10">
          Choose the version that works best for you
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Web */}
          <div className="rounded-2xl p-8 border-2 border-[#b8d9f8] bg-[#f0f8ff]">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#0282e5] text-white mb-4">
              Web
            </span>
            <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">
              Rinse Web
            </h3>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-5">
              Use directly in your browser &mdash; no installation needed. Files
              are processed on our secure servers and automatically deleted after
              2 hours.
            </p>
            <ul className="space-y-2 mb-7">
              {[
                [true, "Works on any device"],
                [true, "No installation required"],
                [true, "Files auto-deleted after 2h"],
                [true, "Always up to date"],
                [false, "Requires internet connection"],
              ].map(([ok, text], i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className={ok ? "text-[#00BB88] font-bold" : "text-gray-300 font-bold"}>
                    {ok ? "\u2713" : "\u2717"}
                  </span>
                  {text as string}
                </li>
              ))}
            </ul>
            <Link
              href="/tools/edit"
              className="inline-block px-7 py-3 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:scale-[1.04] hover:shadow-lg transition-all"
            >
              Use Web Version
            </Link>
          </div>

          {/* Desktop */}
          <div className="rounded-2xl p-8 border-2 border-[#a8e8cc] bg-[#f0fff8]">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#00BB88] text-white mb-4">
              Desktop
            </span>
            <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">
              Rinse Desktop
            </h3>
            <p className="text-[14.5px] text-gray-500 leading-relaxed mb-5">
              Install on your computer for offline use. Files never leave your
              computer &mdash; 100% private and secure. Available for Windows,
              Mac, and Linux.
            </p>
            <ul className="space-y-2 mb-7">
              {[
                [true, "Files never leave your PC"],
                [true, "Works offline"],
                [true, "No file size limits"],
                [true, "Windows, Mac & Linux"],
                [false, "Installation required"],
              ].map(([ok, text], i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className={ok ? "text-[#00BB88] font-bold" : "text-gray-300 font-bold"}>
                    {ok ? "\u2713" : "\u2717"}
                  </span>
                  {text as string}
                </li>
              ))}
            </ul>
            <Link
              href="#"
              className="inline-block px-7 py-3 rounded-lg bg-[#00BB88] text-white text-sm font-bold hover:scale-[1.04] hover:shadow-lg transition-all"
            >
              Download Desktop App
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
