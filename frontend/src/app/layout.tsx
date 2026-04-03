import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Rinse — Free Online PDF Tools",
    template: "%s — Rinse",
  },
  description:
    "Edit, merge, split, compress, and convert PDFs online. 2 free conversions daily. Pay GHS 2.50 per file after that.",
  keywords: [
    "PDF editor",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "PDF to Word",
    "PDF to JPG",
    "online PDF tools",
    "free PDF",
    "Ghana",
  ],
  openGraph: {
    title: "Rinse — Free Online PDF Tools",
    description:
      "Edit, merge, split, compress, and convert PDFs online. 2 free conversions daily.",
    type: "website",
    locale: "en_US",
    siteName: "Rinse",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rinse — Free Online PDF Tools",
    description:
      "Edit, merge, split, compress, and convert PDFs online. 2 free conversions daily.",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "theme-color": "#0282e5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icon-192.png" sizes="192x192" />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-gray-800">
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}` }} />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
