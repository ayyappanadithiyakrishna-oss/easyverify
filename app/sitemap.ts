import type { MetadataRoute } from "next";
const base = "https://easyverify.vercel.app";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/plan",
    "/case",
    "/assistant",
    "/demo",
    "/sources",
    "/history",
    "/identity-check",
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "monthly" as const,
  }));
}
