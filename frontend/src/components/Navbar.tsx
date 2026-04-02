"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const dropdownTools = {
  "Edit & Sign": [
    { name: "PDF Editor", href: "/tools/edit" },
    { name: "Fill & Sign", href: "/tools/fill-sign" },
    { name: "Forms", href: "/tools/forms" },
    { name: "Add Watermark", href: "/tools/watermark" },
    { name: "Bates Numbering", href: "/tools/bates" },
  ],
  Organize: [
    { name: "Merge PDFs", href: "/tools/merge" },
    { name: "Split PDF", href: "/tools/split" },
    { name: "Organize Pages", href: "/tools/organize" },
    { name: "Extract Pages", href: "/tools/extract" },
    { name: "Delete Pages", href: "/tools/delete-pages" },
    { name: "Alternate & Mix", href: "/tools/alternate" },
  ],
  Convert: [
    { name: "PDF to Word", href: "/tools/pdf-to-word" },
    { name: "PDF to Excel", href: "/tools/pdf-to-excel" },
    { name: "PDF to JPG", href: "/tools/pdf-to-jpg" },
    { name: "PDF to PowerPoint", href: "/tools/pdf-to-pptx" },
    { name: "PDF to Text", href: "/tools/pdf-to-text" },
    { name: "Word to PDF", href: "/tools/word-to-pdf" },
    { name: "OCR", href: "/tools/ocr" },
    { name: "HTML to PDF", href: "/tools/html-to-pdf" },
  ],
  Optimize: [
    { name: "Compress PDF", href: "/tools/compress" },
    { name: "Crop PDF", href: "/tools/crop" },
    { name: "Rotate PDF", href: "/tools/rotate" },
    { name: "Protect PDF", href: "/tools/protect" },
    { name: "Unlock PDF", href: "/tools/unlock" },
  ],
};

const quickLinks = [
  { name: "Compress", href: "/tools/compress" },
  { name: "Edit", href: "/tools/edit" },
  { name: "Fill & Sign", href: "/tools/fill-sign" },
  { name: "Merge", href: "/tools/merge" },
  { name: "Delete Pages", href: "/tools/delete-pages" },
  { name: "Crop", href: "/tools/crop" },
];

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-3 shrink-0">
          <div className="w-8 h-8 rounded-md bg-[#00BB88] flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="text-lg font-bold text-[#1a1a2e]">rinse</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1">
          {/* All Tools dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-[#0282e5] transition-colors flex items-center gap-1">
              All Tools
              <span
                className={`text-[11px] transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 p-5 min-w-[540px] z-50">
                <div className="grid grid-cols-4 gap-6">
                  {Object.entries(dropdownTools).map(([category, tools]) => (
                    <div key={category}>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                        {category}
                      </h4>
                      {tools.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          className="block py-1 text-[13px] text-gray-700 hover:text-[#0282e5] transition-colors"
                        >
                          {tool.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-[#0282e5] transition-colors whitespace-nowrap"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/pricing"
            className="hidden md:block px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-[#0282e5] transition-colors"
          >
            Pricing
          </Link>

          {!loading && !user && (
            <>
              <Link
                href="/auth/signin"
                className="hidden md:block px-4 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-600 hover:border-[#0282e5] hover:text-[#0282e5] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-1.5 rounded-md text-sm font-semibold bg-[#0282e5] text-white hover:bg-[#0170c9] transition-colors"
              >
                Sign Up Free
              </Link>
            </>
          )}

          {!loading && user && (
            <div
              className="relative"
              onMouseEnter={() => setUserMenuOpen(true)}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#0282e5] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {(profile?.full_name || user.email || "U")[0].toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:inline max-w-[120px] truncate">
                  {profile?.full_name || user.email}
                </span>
                <span className="text-[11px]">▾</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-[#0282e5]">
                      {profile?.plan || "free"}
                    </span>
                  </div>
                  <Link
                    href="/pricing"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Upgrade Plan
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="lg:hidden ml-2 p-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white p-4">
          {Object.entries(dropdownTools).map(([category, tools]) => (
            <div key={category} className="mb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                {category}
              </h4>
              <div className="grid grid-cols-2 gap-1">
                {tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="py-1.5 text-sm text-gray-700 hover:text-[#0282e5]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {tool.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
