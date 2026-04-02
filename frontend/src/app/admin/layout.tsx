"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

const navItems = [
  { name: "Overview", href: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { name: "Users", href: "/admin/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" },
  { name: "Payments", href: "/admin/payments", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  { name: "Usage", href: "/admin/usage", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    // Wait for profile to load before checking admin status
    if (!profile) return;
    if (!profile.is_admin) {
      router.push("/");
      return;
    }
    setAuthorized(true);
  }, [user, profile, loading, router]);

  if (loading || !authorized) {
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
    <div className="flex min-h-[calc(100vh-60px)]">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a1a2e] text-white shrink-0 hidden md:block">
        <div className="p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#8890aa] mb-4">
            Admin Panel
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-[#8890aa] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-5 border-t border-[#2e3148]">
          <Link href="/" className="text-xs text-[#8890aa] hover:text-white transition-colors">
            &larr; Back to Rinse
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden w-full border-b border-gray-200 bg-gray-50 px-4 py-2 flex gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                active ? "bg-[#0282e5] text-white" : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-50 p-6 md:p-8 overflow-auto">
        {children}
      </div>
    </div>
  );
}
