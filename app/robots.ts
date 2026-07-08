import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/studio/",
          "/admin/",
          "/api/",
          "/profile/",
          "/history",
          "/saved",
        ],
      },
      {
        // Yandex uchun alohida qoida — CIS'da muhim
        userAgent: "Yandexbot",
        allow: "/",
        disallow: [
          "/studio/",
          "/admin/",
          "/api/",
          "/profile/",
          "/history",
          "/saved",
        ],
      },
    ],
    sitemap: "https://twinkle.uz/sitemap.xml",
    host: "https://twinkle.uz",
  };
}
