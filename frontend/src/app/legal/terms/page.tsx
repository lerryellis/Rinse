import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: April 1, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-[15px] leading-relaxed text-gray-600">
        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using Rinse (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">2. Description of Service</h2>
          <p>Rinse provides online PDF processing tools including editing, merging, splitting, compressing, converting, and other document manipulation services. The Service is provided on a freemium basis with pay-per-file pricing.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">3. User Accounts</h2>
          <p>You must create an account to use Rinse. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information during registration and to update it as needed.</p>
          <p>Each individual is permitted one account. Creating multiple accounts to circumvent usage limits is prohibited and may result in account suspension.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">4. Free Tier &amp; Payments</h2>
          <p>Each account receives 2 free file conversions per 24-hour rolling window. After the free tier is exhausted, each additional file action costs GHS 2.50, payable via Paystack (Mobile Money or card).</p>
          <p>All payments are final. Refunds may be issued at our discretion for failed or incomplete processing.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Upload files containing malware, viruses, or harmful code</li>
            <li>Process files that violate copyright or intellectual property laws</li>
            <li>Attempt to bypass usage limits or security measures</li>
            <li>Use the Service for illegal purposes</li>
            <li>Reverse-engineer or scrape the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">6. File Handling &amp; Deletion</h2>
          <p>Uploaded and processed files are stored temporarily and automatically deleted within 2 hours of processing. We do not access, read, or share the contents of your files, except as necessary to provide the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">7. Limitation of Liability</h2>
          <p>The Service is provided &quot;as is&quot; without warranties of any kind. Rinse is not liable for data loss, corruption, or any damages arising from the use of the Service. You are responsible for maintaining backups of your original files.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">8. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting support.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">9. Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the new terms. Material changes will be communicated via email or in-app notification.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">10. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:hi@rinse.dev" className="text-[#0282e5] hover:underline">hi@rinse.dev</a>.</p>
        </section>
      </div>
    </div>
  );
}
