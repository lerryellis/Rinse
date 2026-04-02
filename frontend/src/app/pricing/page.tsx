"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For occasional PDF tasks",
    cta: "Get Started",
    ctaHref: "/auth/signup",
    highlighted: false,
    features: [
      "3 tasks per hour",
      "Max 50 MB file size",
      "All PDF tools included",
      "Files deleted after 2 hours",
      "Basic support",
    ],
  },
  {
    name: "Pro",
    price: "$7",
    period: "/month",
    description: "For power users and professionals",
    cta: "Upgrade to Pro",
    ctaHref: "#",
    highlighted: true,
    features: [
      "Unlimited tasks",
      "Max 200 MB file size",
      "All PDF tools included",
      "Files deleted after 24 hours",
      "Priority support",
      "No watermarks on output",
      "Batch processing",
    ],
  },
  {
    name: "Enterprise",
    price: "$29",
    period: "/month",
    description: "For teams and organizations",
    cta: "Contact Sales",
    ctaHref: "#",
    highlighted: false,
    features: [
      "Everything in Pro",
      "Unlimited file size",
      "API access",
      "Custom file retention",
      "Dedicated support",
      "SSO / SAML",
      "Team management",
      "SLA guarantee",
    ],
  },
];

export default function PricingPage() {
  const { user, profile } = useAuth();

  return (
    <div className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = user && profile?.plan === plan.name.toLowerCase();
            return (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 border-2 relative ${
                  plan.highlighted
                    ? "border-[#0282e5] bg-white shadow-lg shadow-blue-100"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase bg-[#0282e5] text-white">
                    Most Popular
                  </div>
                )}

                <h3 className="text-lg font-bold text-[#1a1a2e] mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#1a1a2e]">{plan.price}</span>
                  <span className="text-sm text-gray-400 ml-1">{plan.period}</span>
                </div>

                {isCurrent ? (
                  <div className="w-full py-3 rounded-lg bg-gray-100 text-center text-sm font-bold text-gray-500 mb-6">
                    Current Plan
                  </div>
                ) : (
                  <Link
                    href={plan.ctaHref}
                    className={`block w-full py-3 rounded-lg text-center text-sm font-bold transition-colors mb-6 ${
                      plan.highlighted
                        ? "bg-[#0282e5] text-white hover:bg-[#0170c9]"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}

                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-[#00BB88] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12 text-sm text-gray-400">
          All plans include access to every PDF tool. Cancel anytime.
        </div>
      </div>
    </div>
  );
}
