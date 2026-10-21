import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/check/", "/workspace", "/onboarding"],
    },
    sitemap: "https://easyverify.vercel.app/sitemap.xml",
  };
}
