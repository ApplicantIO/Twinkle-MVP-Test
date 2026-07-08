import { MetadataRoute } from "next";

const SITE_URL = "https://twinkle.uz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/history`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/saved`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/apply`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/subscriptions`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
  ];

  // Dynamic: Video pages
  let videoPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${SITE_URL}/api/sitemap/videos`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const videos = await res.json();
      videoPages = videos.map((v: { id: string; updatedAt: string }) => ({
        url: `${SITE_URL}/watch/${v.id}`,
        lastModified: new Date(v.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // sitemap'ni bloklama agar API ishlamasa
  }

  // Dynamic: Creator profile pages
  let creatorPages: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${SITE_URL}/api/sitemap/creators`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const creators = await res.json();
      creatorPages = creators.map(
        (c: { username: string; updatedAt: string }) => ({
          url: `${SITE_URL}/${c.username}`,
          lastModified: new Date(c.updatedAt),
          changeFrequency: "weekly" as const,
          priority: 0.9,
        })
      );
    }
  } catch {
    // sitemap'ni bloklama agar API ishlamasa
  }

  return [...staticPages, ...creatorPages, ...videoPages];
}
