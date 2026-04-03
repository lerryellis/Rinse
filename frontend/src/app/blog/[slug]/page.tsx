import type { Metadata } from "next";
import Link from "next/link";

const posts: Record<string, { title: string; date: string; readTime: string; category: string; content: string; tool: string }> = {
  "how-to-compress-pdf": {
    title: "How to Compress a PDF Without Losing Quality",
    date: "2026-04-01",
    readTime: "3 min",
    category: "Guide",
    tool: "/tools/compress",
    content: `
Large PDF files are frustrating. They clog up email attachments, take forever to upload, and eat through your storage. The good news? You can dramatically reduce file size without visible quality loss.

## Why Are PDFs So Large?

PDFs become bloated for several reasons:
- **High-resolution images** embedded at print quality (300+ DPI)
- **Duplicate resources** like fonts included multiple times
- **Uncompressed metadata** and unused objects from editing history

## How Rinse Compresses PDFs

Our compression engine uses three techniques simultaneously:
1. **Garbage collection** — removes unused objects, duplicate resources, and orphaned data
2. **Stream deflation** — applies optimal compression to all data streams
3. **Image optimization** — resamples images while preserving visual quality

## Step-by-Step Guide

1. Go to the **Compress PDF** tool
2. Upload your PDF (up to 50 MB)
3. Click **Compress PDF**
4. Download your smaller file

Most documents shrink by 30-70% without any noticeable difference in quality. Scanned documents with lots of images see the biggest reductions.

## Tips for Smaller PDFs

- **Before creating**: Use web-quality images (150 DPI) instead of print (300 DPI) when the document won't be printed
- **Remove hidden content**: Editing history, comments, and form data all add size
- **Split large documents**: If only a few pages are needed, extract those pages instead of sharing the full document
    `,
  },
  "merge-pdf-files-online": {
    title: "How to Merge Multiple PDFs Into One Document",
    date: "2026-04-01",
    readTime: "2 min",
    category: "Guide",
    tool: "/tools/merge",
    content: `
Combining multiple PDF files is one of the most common document tasks — whether you're assembling a report, combining scanned pages, or packaging documents for a submission.

## How It Works

Rinse merges PDFs entirely in your browser. Your files never leave your device — they're processed using client-side JavaScript with the pdf-lib library.

## Step-by-Step Guide

1. Go to the **Merge PDFs** tool
2. Upload two or more PDF files
3. **Drag to reorder** the files in the order you want
4. Click **Merge PDFs**
5. Download the combined document

## Pro Tips

- **File order matters**: Drag files up or down to arrange them before merging
- **No page limit**: Merge as many PDFs as you need — 2 or 200
- **Preserves formatting**: All fonts, images, links, and bookmarks are kept intact
- **Works offline**: Since it runs in your browser, you can merge PDFs even without internet (after the initial page load)
    `,
  },
  "pdf-to-word-conversion": {
    title: "Converting PDF to Word: What You Need to Know",
    date: "2026-04-02",
    readTime: "4 min",
    category: "Guide",
    tool: "/tools/pdf-to-word",
    content: `
Converting a PDF back to an editable Word document is tricky — PDFs are designed for presentation, not editing. Here's what affects conversion quality and how to get the best results.

## What Converts Well

- **Text-based PDFs** (created from Word, Google Docs, etc.) convert with high accuracy
- **Simple layouts** with single-column text transfer nearly perfectly
- **Standard fonts** are matched to their closest Word equivalents

## What's Challenging

- **Scanned documents** (image-based PDFs) need OCR first — use our OCR tool before converting
- **Complex tables** may need manual cleanup after conversion
- **Custom fonts** might be substituted with system fonts
- **Multi-column layouts** can sometimes merge into a single column

## Step-by-Step Guide

1. Go to the **PDF to Word** tool
2. Upload your PDF
3. Click **PDF to Word**
4. Download the .docx file and open in Word or Google Docs

## Getting Better Results

- **Use OCR first** if your PDF is a scan (text appears as an image)
- **Check formatting** in the output — headings, bold, and italic are preserved when possible
- **Simple is better** — the simpler the original layout, the cleaner the conversion
    `,
  },
  "sign-pdf-electronically": {
    title: "How to Sign a PDF Document Electronically",
    date: "2026-04-02",
    readTime: "3 min",
    category: "Guide",
    tool: "/tools/fill-sign",
    content: `
The days of printing a document just to sign it and scan it back are over. With Rinse's Fill & Sign tool, you can add your signature directly to any PDF.

## Three Ways to Sign

1. **Draw it** — Use your mouse or finger (on mobile) to draw your signature on our signature pad
2. **Type it** — Type your name and we'll render it in a signature-style font
3. **Place it** — Click anywhere on the document to position your signature

## Step-by-Step Guide

1. Go to the **Fill & Sign** tool
2. Upload your PDF document
3. Click the **Sign** tool in the toolbar
4. Draw your signature on the pad that appears
5. Click **Use Signature** to save it
6. Click anywhere on the document to place it
7. Resize or reposition as needed
8. Click **Save & Download**

## Additional Fields

Beyond signatures, you can also add:
- **Text fields** — fill in form fields, names, addresses
- **Dates** — auto-inserts today's date
- **Initials** — for documents that require initialing each page

## Is It Legally Valid?

Electronic signatures are legally recognized in most jurisdictions. However, for contracts requiring witnessed or notarized signatures, consult your legal requirements.
    `,
  },
  "html-to-pdf-guide": {
    title: "Convert Any Webpage to PDF: A Complete Guide",
    date: "2026-04-03",
    readTime: "3 min",
    category: "Guide",
    tool: "/tools/html-to-pdf",
    content: `
Need to save a webpage, generate a report from HTML, or create a PDF from a web application? Rinse converts HTML to pixel-perfect PDFs using a real browser engine.

## Three Input Methods

1. **From URL** — Enter any public webpage URL and we'll render it exactly as it appears in a browser
2. **Paste HTML** — Paste raw HTML code directly and we'll convert it
3. **Upload file** — Upload a .html file from your computer

## Customization Options

- **Page size**: A4, Letter, A3, Legal, or Tabloid
- **Orientation**: Portrait or Landscape
- **Margins**: Automatic 20mm margins for clean printing
- **Background**: Colors and images are preserved

## Step-by-Step Guide

1. Go to the **HTML to PDF** tool
2. Choose your input method (URL, paste, or upload)
3. Select your preferred page size and orientation
4. Click **Convert to PDF**
5. Download the result

## For Developers

Our API also supports HTML to PDF conversion programmatically:

Send a POST request to /api/v1/html-to-pdf with your API key and either an html or url field in the JSON body. The API returns the PDF as a binary stream.

This is ideal for generating invoices, reports, or certificates from your application.
    `,
  },
  "pdf-security-best-practices": {
    title: "PDF Security: How to Protect Sensitive Documents",
    date: "2026-04-03",
    readTime: "5 min",
    category: "Security",
    tool: "/tools/protect",
    content: `
PDFs often contain sensitive information — contracts, financial records, personal data. Here's how to keep them secure.

## Password Protection

The most common way to secure a PDF is with a password. Rinse uses AES-256 encryption — the same standard used by banks and governments.

### How to password-protect a PDF:
1. Go to the **Protect PDF** tool
2. Upload your document
3. Enter your desired password
4. Click **Protect PDF**
5. Download the encrypted file

Anyone who tries to open the file will need the password.

## Best Practices

1. **Use strong passwords** — at least 12 characters with mixed case, numbers, and symbols
2. **Don't email the password with the file** — send it via a different channel (text, phone call)
3. **Remove sensitive metadata** — PDFs can contain author names, edit history, and GPS data
4. **Limit sharing** — only send the file to people who need it
5. **Set expiry** — when using Rinse, files are automatically deleted from our servers after 2 hours

## Removing Passwords

If you have a password-protected PDF and know the password, you can remove the protection:

1. Go to the **Unlock PDF** tool
2. Upload the protected file
3. Enter the password
4. Download the unprotected version

## What About Digital Signatures?

Password protection prevents unauthorized viewing. Digital signatures verify that a document hasn't been tampered with. They serve different purposes — use both for maximum security.
    `,
  },
};

export async function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) return { title: "Post Not Found" };
  return { title: `${post.title} — Rinse Blog`, description: post.content.slice(0, 160).trim() };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts[slug];

  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Post Not Found</h1>
          <Link href="/blog" className="text-[#0282e5] hover:underline">Back to blog</Link>
        </div>
      </div>
    );
  }

  const sections = post.content.trim().split("\n\n").filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/blog" className="text-sm text-[#0282e5] hover:underline mb-6 inline-block">&larr; Back to blog</Link>

      <div className="flex items-center gap-2 mb-4">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-[#0282e5]">{post.category}</span>
        <span className="text-xs text-gray-400">{post.readTime} read</span>
        <span className="text-xs text-gray-400">&middot;</span>
        <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
      </div>

      <h1 className="text-3xl font-bold text-[#1a1a2e] mb-8 leading-tight">{post.title}</h1>

      <div className="prose max-w-none space-y-4 text-[15px] leading-relaxed text-gray-600">
        {sections.map((section, i) => {
          if (section.startsWith("## ")) {
            return <h2 key={i} className="text-xl font-bold text-gray-800 mt-8 mb-3">{section.replace("## ", "")}</h2>;
          }
          if (section.startsWith("### ")) {
            return <h3 key={i} className="text-lg font-bold text-gray-800 mt-6 mb-2">{section.replace("### ", "")}</h3>;
          }
          if (section.startsWith("- ") || section.startsWith("1. ")) {
            const items = section.split("\n").filter(Boolean);
            const ordered = section.startsWith("1.");
            const Tag = ordered ? "ol" : "ul";
            return (
              <Tag key={i} className={`${ordered ? "list-decimal" : "list-disc"} pl-6 space-y-1`}>
                {items.map((item, j) => (
                  <li key={j} className="text-gray-600">{item.replace(/^[-\d]+[.)]\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}</li>
                ))}
              </Tag>
            );
          }
          return <p key={i}>{section.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
        })}
      </div>

      {/* CTA */}
      <div className="mt-12 bg-[#ebf5fe] rounded-2xl p-8 text-center">
        <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">Try it yourself</h3>
        <p className="text-sm text-gray-500 mb-4">2 free conversions daily. No registration required.</p>
        <Link href={post.tool} className="inline-block px-6 py-3 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:bg-[#0170c9] transition-colors">
          Use this tool
        </Link>
      </div>
    </div>
  );
}
