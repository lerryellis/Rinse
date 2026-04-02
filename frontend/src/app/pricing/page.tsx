"use client";

import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-3">
            Simple, pay-as-you-go pricing
          </h1>
          <p className="text-lg text-gray-500">
            Start with 2 free conversions. After that, pay per file.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="rounded-2xl p-7 border-2 border-gray-200 bg-white">
            <h3 className="text-lg font-bold text-[#1a1a2e] mb-1">Free</h3>
            <p className="text-sm text-gray-500 mb-5">Try Rinse with no commitment</p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-[#1a1a2e]">GHS 0</span>
            </div>

            <Link
              href="/auth/signup"
              className="block w-full py-3 rounded-lg text-center text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors mb-6"
            >
              Get Started
            </Link>

            <ul className="space-y-2.5">
              {[
                "2 free conversions",
                "All PDF tools included",
                "Max 50 MB per file",
                "Files deleted after 2 hours",
                "No registration required",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-[#00BB88] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pay per file */}
          <div className="rounded-2xl p-7 border-2 border-[#0282e5] bg-white shadow-lg shadow-blue-100 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#0282e5] text-white">
              Pay As You Go
            </div>

            <h3 className="text-lg font-bold text-[#1a1a2e] mb-1">Per File</h3>
            <p className="text-sm text-gray-500 mb-5">Pay only for what you use</p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-[#1a1a2e]">GHS 2.50</span>
              <span className="text-sm text-gray-400 ml-1">/ file</span>
            </div>

            <Link
              href="/tools/edit"
              className="block w-full py-3 rounded-lg text-center text-sm font-bold bg-[#0282e5] text-white hover:bg-[#0170c9] transition-colors mb-6"
            >
              Start Using Tools
            </Link>

            <ul className="space-y-2.5">
              {[
                "GHS 2.50 per file action",
                "All PDF tools included",
                "Max 50 MB per file",
                "Files deleted after 2 hours",
                "Pay with Mobile Money or Card",
                "Instant Paystack checkout",
                "No subscription required",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-[#00BB88] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 bg-[#f0f8ff] rounded-2xl p-8 text-center">
          <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">How it works</h3>
          <div className="grid sm:grid-cols-3 gap-6 mt-6">
            <div>
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center text-[#0282e5] font-bold">1</div>
              <p className="text-sm text-gray-600">Upload your file and choose a tool</p>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center text-[#0282e5] font-bold">2</div>
              <p className="text-sm text-gray-600">First 2 actions are free. After that, pay GHS 2.50</p>
            </div>
            <div>
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center text-[#0282e5] font-bold">3</div>
              <p className="text-sm text-gray-600">Download your processed file instantly</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-400">
          Payments powered by Paystack. Mobile Money &amp; Visa/Mastercard accepted.
        </div>
      </div>
    </div>
  );
}
