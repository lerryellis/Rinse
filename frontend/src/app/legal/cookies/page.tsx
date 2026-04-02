import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookies Policy" };

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#1a1a2e] mb-2">Cookies Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: April 1, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-[15px] leading-relaxed text-gray-600">
        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">What Are Cookies</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and session state.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">Cookies We Use</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-semibold text-gray-800">Cookie</th>
                <th className="text-left py-2 pr-4 font-semibold text-gray-800">Purpose</th>
                <th className="text-left py-2 font-semibold text-gray-800">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">sb-access-token</td>
                <td className="py-2 pr-4">Authentication session (Supabase)</td>
                <td className="py-2">1 hour</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 pr-4">sb-refresh-token</td>
                <td className="py-2 pr-4">Refresh expired sessions</td>
                <td className="py-2">7 days</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">Third-Party Cookies</h2>
          <p>We do not use advertising or analytics cookies. Paystack may set cookies during the payment flow, governed by <a href="https://paystack.com/privacy" className="text-[#0282e5] hover:underline" target="_blank" rel="noopener noreferrer">Paystack&apos;s Privacy Policy</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">Device Fingerprinting</h2>
          <p>We use browser fingerprinting (not cookies) to prevent abuse of the free tier. This generates a hashed device identifier from browser characteristics. It cannot identify you personally and is not shared with third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">Managing Cookies</h2>
          <p>You can disable cookies in your browser settings. Note that disabling authentication cookies will prevent you from signing in to Rinse.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mt-8 mb-3">Contact</h2>
          <p>Questions about our cookie practices? Email <a href="mailto:hi@rinse.dev" className="text-[#0282e5] hover:underline">hi@rinse.dev</a>.</p>
        </section>
      </div>
    </div>
  );
}
