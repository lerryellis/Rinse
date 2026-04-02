"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const trxref = searchParams.get("trxref");
  const ref = reference || trxref;

  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [tool, setTool] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) {
      setStatus("failed");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/payments/verify/${ref}`)
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.paid ? "success" : "failed");
        // Retrieve tool from localStorage
        const savedTool = localStorage.getItem("rinse_pending_tool");
        if (savedTool) setTool(savedTool);
      })
      .catch(() => setStatus("failed"));
  }, [ref]);

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <svg className="w-10 h-10 animate-spin text-[#0282e5] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Payment failed</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your payment could not be verified. Please try again.
          </p>
          <Link href="/" className="text-[#0282e5] text-sm font-medium hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Payment successful!</h1>
        <p className="text-sm text-gray-500 mb-6">
          GHS 2.50 has been charged. You can now process your file.
        </p>
        {tool ? (
          <Link
            href={`/tools/${tool}`}
            className="inline-block px-6 py-3 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:bg-[#0170c9] transition-colors"
          >
            Continue to {tool.replace(/-/g, " ")}
          </Link>
        ) : (
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:bg-[#0170c9] transition-colors"
          >
            Back to tools
          </Link>
        )}
      </div>
    </div>
  );
}
