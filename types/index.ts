export type UserRole = 'viewer' | 'creator' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  profileImageUrl?: string;
  bannerUrl?: string;
  aboutText?: string;
  createdAt: Date;
}

export type VideoType = 'free' | 'paid' | 'subscription';

export interface Video {
  id: string;
  userId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  views: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  // Video monetization fields
  type?: VideoType; // 'free', 'paid', 'subscription'
  price?: number; // Price in local currency for paid videos
  currency?: string; // Currency code (e.g., 'USD', 'UZS')
  // Dual source strategy for paid/subscription content
  teaserVideoUrl?: string; // Teaser/trailer video URL (shown when no access)
  fullVideoUrl?: string; // Full video URL (shown when access granted)
  purchaseCoverUrl?: string; // Custom image URL for purchase screen (optional, defaults to lock icon)
  // Live streaming fields
  isLive?: boolean; // Whether the video is currently live
  liveViewers?: number; // Current number of live viewers
  duration?: number; // Video duration in seconds (for non-live videos)
  user?: {
    id: string;
    name?: string;
    profileImageUrl?: string;
  };
}

export interface Analytics {
  id: string;
  videoId: string;
  userId?: string;
  viewerIp?: string;
  viewedAt: Date;
}
