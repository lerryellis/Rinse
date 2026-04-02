import type { Metadata } from "next";

export const metadata: Metadata = { title: "Service Level Agreement" };

export default function SLAPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">Service Level Agreement</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: April 1, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-[15px] leading-relaxed text-gray-600">
        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">1. Uptime Commitment</h2>
          <p>Rinse targets <strong>99.5% monthly uptime</strong> for the web application and API. Uptime is calculated as:</p>
          <p className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
            Uptime % = (Total Minutes - Downtime Minutes) / Total Minutes &times; 100
          </p>
          <p>Scheduled maintenance windows (communicated at least 24 hours in advance) are excluded from downtime calculations.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">2. Processing Times</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-semibold text-gray-800">Operation</th>
                <th className="text-left py-2 font-semibold text-gray-800">Target</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">Client-side tools (merge, split, rotate)</td>
                <td className="py-2">&lt; 5 seconds for files under 20 MB</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">Server-side tools (compress, convert)</td>
                <td className="py-2">&lt; 30 seconds for files under 50 MB</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">File deletion</td>
                <td className="py-2">Within 2 hours of processing</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">3. Support Response Times</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-semibold text-gray-800">Severity</th>
                <th className="text-left py-2 pr-4 font-semibold text-gray-800">Description</th>
                <th className="text-left py-2 font-semibold text-gray-800">Response</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">Critical</td>
                <td className="py-2 pr-4">Service completely unavailable</td>
                <td className="py-2">Within 2 hours</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">High</td>
                <td className="py-2 pr-4">Major feature broken, no workaround</td>
                <td className="py-2">Within 8 hours</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">Medium</td>
                <td className="py-2 pr-4">Feature degraded, workaround available</td>
                <td className="py-2">Within 24 hours</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium">Low</td>
                <td className="py-2 pr-4">General questions, minor issues</td>
                <td className="py-2">Within 48 hours</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">4. Remedies</h2>
          <p>If we fail to meet the 99.5% uptime target in a given month, affected paying users may request a credit for the proportional amount of downtime. Credits are applied to future payments and must be requested within 30 days.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">5. Exclusions</h2>
          <p>This SLA does not apply to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Scheduled maintenance (communicated 24h in advance)</li>
            <li>Force majeure events</li>
            <li>Issues caused by user&apos;s browser, network, or device</li>
            <li>Third-party service outages (Supabase, Paystack, Vercel, Railway)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">6. Contact</h2>
          <p>To report an outage or request a credit, contact <a href="mailto:hi@rinse.dev" className="text-[#0282e5] hover:underline">hi@rinse.dev</a>.</p>
        </section>
      </div>
    </div>
  );
}
