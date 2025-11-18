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
