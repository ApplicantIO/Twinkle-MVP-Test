import { SITE_URL } from "./constants";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Twinkle",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
    width: 200,
    height: 60,
  },
  sameAs: [
    "https://t.me/twinkle_community",
    "https://instagram.com/twinkle.uz",
    "https://youtube.com/c/twinkle_official",
    "https://twitter.com/twinkleuz",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@twinkle.uz",
    availableLanguage: ["Uzbek", "Russian", "English"],
  },
  description:
    "O'zbekiston va Markaziy Osiyo kontent yaratuvchilari uchun monetizatsiya platformasi.",
  foundingDate: "2024",
  areaServed: ["UZ", "KZ", "KG", "TJ", "TM"],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Twinkle",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: ["uz", "ru", "en"],
};

export function videoObjectSchema(video: {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  createdAt: string;
  views: number;
  creatorName: string;
  creatorUsername: string;
  duration?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    contentUrl: video.videoUrl,
    embedUrl: `${SITE_URL}/watch/${video.id}`,
    uploadDate: video.createdAt,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/WatchAction",
      userInteractionCount: video.views,
    },
    author: {
      "@type": "Person",
      name: video.creatorName,
      url: `${SITE_URL}/${video.creatorUsername}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Twinkle",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    ...(video.duration && { duration: `PT${Math.floor(video.duration)}S` }),
  };
}

export function creatorProfileSchema(creator: {
  name: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  subscriberCount: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: creator.name,
      identifier: creator.username,
      url: `${SITE_URL}/${creator.username}`,
      description: creator.bio,
      image: creator.avatarUrl,
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/FollowAction",
          userInteractionCount: creator.subscriberCount,
        },
      ],
      sameAs: [`${SITE_URL}/${creator.username}`],
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
