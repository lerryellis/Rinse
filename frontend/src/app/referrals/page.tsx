"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import Link from "next/link";

interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  bonus_conversions: number;
}

export default function ReferralsPage() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/referrals/info`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => { setInfo(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  const copyLink = () => {
    if (!info) return;
    navigator.clipboard.writeText(info.referral_link).then(() => {
      setCopied(true);
      toast("Referral link copied!", "success");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-4">Sign in to access referrals</p>
          <Link href="/auth/signin" className="px-6 py-2.5 rounded-lg bg-[#0282e5] text-white text-sm font-bold">Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-[#0282e5]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">Invite Friends, Get Free Conversions</h1>
      <p className="text-gray-500 mb-8">
        Share your referral link. When a friend signs up and you both get <strong>2 extra free conversions</strong>.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-2xl font-bold text-[#1a1a2e]">{info?.total_referrals || 0}</div>
          <div className="text-xs text-gray-400 mt-1">Friends Referred</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-2xl font-bold text-[#00BB88]">{info?.bonus_conversions || 0}</div>
          <div className="text-xs text-gray-400 mt-1">Bonus Conversions</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="text-2xl font-bold text-[#0282e5]">2</div>
          <div className="text-xs text-gray-400 mt-1">Per Referral</div>
        </div>
      </div>

      {/* Referral code */}
      <div className="bg-[#f0f8ff] rounded-2xl p-6 border-2 border-[#b8d9f8] mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Your referral code</label>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white rounded-lg border border-gray-200 px-4 py-3 font-mono text-lg font-bold text-[#1a1a2e] tracking-wider">
            {info?.referral_code || "..."}
          </div>
        </div>
      </div>

      {/* Share link */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Share this link</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={info?.referral_link || ""}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 bg-gray-50"
            aria-label="Referral link"
          />
          <button
            type="button"
            onClick={copyLink}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              copied ? "bg-[#00BB88] text-white" : "bg-[#0282e5] text-white hover:bg-[#0170c9]"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-sm font-bold text-gray-800 mb-4">How it works</h3>
        <div className="space-y-3">
          {[
            ["1", "Share your referral link with a friend"],
            ["2", "They sign up using your link"],
            ["3", "You both get 2 extra free conversions added to your daily limit"],
          ].map(([num, text]) => (
            <div key={num} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#0282e5] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">{num}</span>
              </div>
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
