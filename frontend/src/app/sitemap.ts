import type { MetadataRoute } from "next";

const tools = [
  "edit", "fill-sign", "forms", "watermark", "bates",
  "merge", "split", "organize", "extract", "delete-pages", "alternate",
  "pdf-to-word", "pdf-to-excel", "pdf-to-jpg", "pdf-to-pptx", "pdf-to-text", "word-to-pdf", "ocr",
  "compress", "crop", "rotate", "protect", "unlock",
];

const BASE = "https://rinse.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolPages = tools.map((tool) => ({
    url: `${BASE}/tools/${tool}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/auth/signin`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/auth/signup`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    ...toolPages,
  ];
}
