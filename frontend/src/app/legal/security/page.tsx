import type { Metadata } from "next";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">Security</h1>
      <p className="text-sm text-gray-400 mb-8">How we keep your files and data safe</p>

      <div className="prose prose-gray max-w-none space-y-6 text-[15px] leading-relaxed text-gray-600">
        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">Encryption</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>In transit:</strong> All connections use TLS 1.2+ (HTTPS). No data is ever transmitted over plain HTTP.</li>
            <li><strong>At rest:</strong> Database is encrypted at rest via Supabase (AES-256). Temporary files in storage are encrypted by the cloud provider.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">File Handling</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Files are processed in isolated, ephemeral environments</li>
            <li>All uploaded and processed files are automatically deleted within 2 hours</li>
            <li>Files are stored in a private Supabase Storage bucket &mdash; no public URLs</li>
            <li>We never read, index, or analyze the contents of your files</li>
            <li>Client-side tools (merge, split, rotate, etc.) process files entirely in your browser &mdash; they never reach our servers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">Authentication</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Powered by Supabase Auth with JWT tokens</li>
            <li>Supports email/password and Google OAuth</li>
            <li>Passwords are hashed using bcrypt (never stored in plain text)</li>
            <li>Session tokens expire after 1 hour and are refreshed automatically</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">Database Security</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Row Level Security (RLS) enabled on all tables &mdash; users can only access their own data</li>
            <li>Service role keys are only used server-side, never exposed to the client</li>
            <li>All queries are parameterized to prevent SQL injection</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">Payments</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Processed by Paystack, a PCI-DSS Level 1 certified provider</li>
            <li>We never see or store card numbers, CVVs, or Mobile Money PINs</li>
            <li>Only transaction references and amounts are stored on our side</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">Infrastructure</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Frontend hosted on Vercel (global CDN, automatic HTTPS)</li>
            <li>Backend hosted on Railway (isolated containers, automatic scaling)</li>
            <li>Database hosted on Supabase (AWS eu-west-1, daily backups)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">Reporting Vulnerabilities</h2>
          <p>If you discover a security vulnerability, please report it responsibly to <a href="mailto:hi@rinse.dev" className="text-[#0282e5] hover:underline">hi@rinse.dev</a>. We will investigate promptly and keep you informed.</p>
        </section>
      </div>
    </div>
  );
}
