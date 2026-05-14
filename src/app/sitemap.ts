import type { MetadataRoute } from "next";
import { db } from "@/db";
import { MAKES } from "@/data/makes";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://auti.hr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/oglasi`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${BASE}/objavi`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/prijava`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/registracija`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/o-nama`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/kontakt`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/uvjeti`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const brandRoutes: MetadataRoute.Sitemap = MAKES.map((m) => ({
    url: `${BASE}/oglasi?make=${m.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  let slugRows: Awaited<ReturnType<ReturnType<typeof db>["getAllActiveSlugs"]>> = [];
  try {
    slugRows = await db().getAllActiveSlugs();
  } catch (err) {
    console.warn("[sitemap] getAllActiveSlugs failed:", err);
  }
  const listingRoutes: MetadataRoute.Sitemap = slugRows.map((l) => ({
    url: `${BASE}/oglasi/${l.slug}`,
    lastModified: new Date(l.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...brandRoutes, ...listingRoutes];
}
