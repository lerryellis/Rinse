"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const steps = [
  {
    title: "Welcome to Rinse!",
    body: "Your go-to platform for all PDF tasks. Merge, split, compress, convert, edit, sign — all in one place.",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    title: "2 Free Conversions Daily",
    body: "Every day you get 2 free file actions. After that, each additional file costs just GHS 2.50 via Mobile Money or card.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Your Files Stay Private",
    body: "Client-side tools (merge, split, rotate) process files entirely in your browser — they never touch our servers. Server-side files are deleted within 2 hours.",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    title: "Invite Friends for Bonuses",
    body: "Share your referral link. When a friend signs up, you both get 2 extra free conversions added to your daily limit.",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
];

export default function Onboarding() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    const seen = localStorage.getItem("rinse_onboarding_done");
    if (!seen) setShow(true);
  }, [user]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("rinse_onboarding_done", "true");
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else dismiss();
  };

  if (!show) return null;

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#0282e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={current.icon} />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">{current.title}</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">{current.body}</p>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-[#0282e5]" : "bg-gray-200"}`} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={next}
            className="flex-1 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold hover:bg-[#0170c9] transition-colors"
          >
            {step < steps.length - 1 ? "Next" : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}
