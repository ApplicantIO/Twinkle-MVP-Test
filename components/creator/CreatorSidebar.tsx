'use client';

import { User as UserIcon } from 'lucide-react';

export interface CreatorSidebarProps {
  avatar: string;
  name: string;
  subscribers: number;
  totalViews: string;
  videoCount: number;
  bio: string;
  social: {
    telegram: string;
    instagram: string;
    tiktok: string;
  };
  onSubscribe?: () => void;
}

export function CreatorSidebar({
  avatar,
  name,
  subscribers,
  totalViews,
  videoCount,
  bio,
  social,
  onSubscribe,
}: CreatorSidebarProps) {
  const formattedSubs = subscribers >= 1000 
    ? `${(subscribers / 1000).toFixed(1)}K` 
    : subscribers.toString();

  return (
    <aside className="lg:col-span-3 space-y-6">
      <div className="flex flex-col items-center lg:items-start">
        <div className="relative w-48 h-48 rounded-2xl ring-4 ring-surface/50 shadow-2xl overflow-hidden bg-surface flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon className="w-20 h-20 text-text-secondary" />
            </div>
          )}
        </div>
        <h2 className="mt-4 text-lg font-bold text-text-primary">{name}</h2>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-text-secondary">
          <span>Subscribers</span>
          <span className="font-medium text-text-primary">{formattedSubs}</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Total views</span>
          <span className="font-medium text-text-primary">{totalViews}</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Videos</span>
          <span className="font-medium text-text-primary">{videoCount}</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">About</h3>
        <p className="text-sm text-text-secondary line-clamp-3">{bio}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Connect</h3>
        <div className="flex gap-3">
          <a
            href={social.telegram.startsWith('http') ? social.telegram : `https://${social.telegram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-accent transition-colors"
            aria-label="Telegram"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>
          <a
            href={social.instagram.startsWith('http') ? social.instagram : `https://instagram.com/${social.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-accent transition-colors"
            aria-label="Instagram"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a
            href={social.tiktok.startsWith('http') ? social.tiktok : `https://tiktok.com/@${social.tiktok.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-accent transition-colors"
            aria-label="TikTok"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
            </svg>
          </a>
        </div>
      </div>

      <button
        onClick={onSubscribe}
        className="w-full py-2 px-4 rounded-full border border-surface text-text-primary hover:bg-surface/50 transition-colors text-sm font-medium"
      >
        Subscribe
      </button>
    </aside>
  );
}
