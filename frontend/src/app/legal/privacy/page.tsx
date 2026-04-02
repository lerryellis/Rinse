import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: April 1, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-[15px] leading-relaxed text-gray-600">
        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">1. Information We Collect</h2>
          <p><strong>Account information:</strong> When you sign up, we collect your email address, name, and authentication credentials (managed by Supabase Auth).</p>
          <p><strong>Usage data:</strong> We record which tools you use, file sizes, timestamps, and device fingerprints for anti-abuse purposes.</p>
          <p><strong>Payment data:</strong> Payment processing is handled by Paystack. We store transaction references and amounts but never store card numbers or Mobile Money PINs.</p>
          <p><strong>Device information:</strong> We collect a browser fingerprint to prevent abuse of the free tier. This is a hashed identifier and cannot be used to identify you personally.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and improve the PDF processing service</li>
            <li>To enforce usage limits and prevent abuse</li>
            <li>To process payments</li>
            <li>To communicate service updates or issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">3. File Privacy</h2>
          <p>Your uploaded files are processed in memory or in temporary storage. All files are automatically deleted within 2 hours of upload. We do not read, analyze, or share the contents of your files. Files are never used for training, analytics, or any purpose other than the specific processing you requested.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">4. Data Sharing</h2>
          <p>We do not sell your personal information. We share data only with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase:</strong> Database and authentication hosting</li>
            <li><strong>Paystack:</strong> Payment processing</li>
            <li><strong>Vercel/Railway:</strong> Application hosting</li>
          </ul>
          <p>These providers process data solely to deliver their services and are bound by their own privacy policies.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">5. Data Retention</h2>
          <p>Uploaded files: deleted within 2 hours. Account data: retained while your account is active. Usage logs: retained for 90 days. Payment records: retained for 7 years (legal/tax requirement).</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">6. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting <a href="mailto:hi@rinse.dev" className="text-[#0282e5] hover:underline">hi@rinse.dev</a>. Account deletion will remove all associated data within 30 days.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">7. Security</h2>
          <p>We use HTTPS encryption for all data in transit, row-level security on our database, and automatic file expiry. See our <a href="/legal/security" className="text-[#0282e5] hover:underline">Security page</a> for details.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">8. Contact</h2>
          <p>For privacy inquiries, contact <a href="mailto:hi@rinse.dev" className="text-[#0282e5] hover:underline">hi@rinse.dev</a>.</p>
        </section>
      </div>
    </div>
  );
}
