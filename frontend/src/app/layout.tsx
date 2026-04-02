import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-white text-gray-800">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
