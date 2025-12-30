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
  saleDescription?: string; // Custom description for purchase screen (optional, defaults to standard text)
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

// Transaction/Receipt data structure for permanent storage
export interface Transaction {
  transactionId: string;
  userId: string;
  productId: string; // Video/Subscription ID
  productTitle: string;
  productType: 'paid' | 'subscription';
  creatorId: string;
  creatorName?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethodUsed: string; // e.g., 'UzCard', 'Visa', 'Payme', 'Click'
  securityProvider: string; // e.g., 'Multibank'
  purchaseDate: Date;
  billingAddress?: string;
  userName?: string;
}

// Playlist & Super-album system
export interface PlaylistSection {
  id: string;
  title: string;
  videoIds: string[];
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  creatorName: string; // Creator's name (e.g., "Konsta")
  creatorId?: string; // Creator's user ID for linking to channel
  creatorAvatar?: string; // Creator's profile image URL
  type: string; // e.g., 'Musical Playlist', 'Course'
  price?: string; // Price as string (e.g., '50,000 UZS')
  isSubscription?: boolean;
  lastUpdated: string; // ISO date string
  videoCount: number;
  sections: PlaylistSection[];
  allVideoIds: string[];
  thumbnail?: string; // Creator-provided playlist thumbnail
  firstVideoThumbnail?: string; // Thumbnail from first video (fallback)
}
