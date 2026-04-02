import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/callback", "/payment/"],
    },
    sitemap: "https://rinse.vercel.app/sitemap.xml",
  };
}
