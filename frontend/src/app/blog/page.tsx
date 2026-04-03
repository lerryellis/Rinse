import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog — Rinse",
  description: "Guides, tips, and tutorials for working with PDFs online.",
};

const posts = [
  {
    slug: "how-to-compress-pdf",
    title: "How to Compress a PDF Without Losing Quality",
    excerpt: "Large PDF files slow everything down. Learn how to reduce file size while keeping your documents sharp and readable.",
    date: "2026-04-01",
    readTime: "3 min",
    category: "Guide",
  },
  {
    slug: "merge-pdf-files-online",
    title: "How to Merge Multiple PDFs Into One Document",
    excerpt: "Combining several PDFs into a single file is one of the most common document tasks. Here's how to do it in seconds.",
    date: "2026-04-01",
    readTime: "2 min",
    category: "Guide",
  },
  {
    slug: "pdf-to-word-conversion",
    title: "Converting PDF to Word: What You Need to Know",
    excerpt: "Not all PDF to Word conversions are equal. Learn what affects quality and how to get the best results.",
    date: "2026-04-02",
    readTime: "4 min",
    category: "Guide",
  },
  {
    slug: "sign-pdf-electronically",
    title: "How to Sign a PDF Document Electronically",
    excerpt: "Skip the print-sign-scan cycle. Draw, type, or upload your signature and place it directly on any PDF.",
    date: "2026-04-02",
    readTime: "3 min",
    category: "Guide",
  },
  {
    slug: "html-to-pdf-guide",
    title: "Convert Any Webpage to PDF: A Complete Guide",
    excerpt: "Save web pages, invoices, and HTML reports as perfectly formatted PDF documents.",
    date: "2026-04-03",
    readTime: "3 min",
    category: "Guide",
  },
  {
    slug: "pdf-security-best-practices",
    title: "PDF Security: How to Protect Sensitive Documents",
    excerpt: "Password protection, encryption, and best practices for keeping your PDFs secure.",
    date: "2026-04-03",
    readTime: "5 min",
    category: "Security",
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">Blog</h1>
      <p className="text-gray-500 mb-10">Guides, tips, and tutorials for working with PDFs</p>

      <div className="grid sm:grid-cols-2 gap-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block bg-white rounded-xl border border-gray-200 p-6 hover:-translate-y-1 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-[#0282e5]">
                {post.category}
              </span>
              <span className="text-xs text-gray-400">{post.readTime} read</span>
            </div>
            <h2 className="text-lg font-bold text-[#1a1a2e] group-hover:text-[#0282e5] transition-colors mb-2">
              {post.title}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">{post.excerpt}</p>
            <p className="text-xs text-gray-300 mt-4">{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
