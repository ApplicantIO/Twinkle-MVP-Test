'use client';

import Link from 'next/link';
import { Playlist } from '@/types';
import { Lock, Crown } from 'lucide-react';
import { useState } from 'react';
import { usePurchase } from '@/contexts/PurchaseContext';

interface PlaylistCardProps {
  playlist: Playlist;
  hoveredPlaylist?: string | null;
  setHoveredPlaylist?: (id: string | null) => void;
}

export default function PlaylistCard({ playlist, hoveredPlaylist, setHoveredPlaylist }: PlaylistCardProps) {
  const isHovered = hoveredPlaylist === playlist.id;
  const [imageLoaded, setImageLoaded] = useState(false);
  const { checkPlaylistPurchased } = usePurchase();

  // Check if user has access to this playlist
  // If purchased/subscribed, we won't show any badge
  const isPurchased = playlist.price ? checkPlaylistPurchased(playlist.id) : false;
  const isSubscribed = false; // TODO: Enhance with subscription context when available
  const hasAccess = (playlist.price && isPurchased) || (playlist.isSubscription && isSubscribed);

  // Get thumbnail: playlist.thumbnail || firstVideo.thumbnail
  const thumbnailUrl = playlist.thumbnail || playlist.firstVideoThumbnail;

  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group cursor-pointer flex flex-col relative"
      onMouseEnter={() => setHoveredPlaylist?.(playlist.id)}
      onMouseLeave={() => setHoveredPlaylist?.(null)}
    >
      {/* Card Container */}
      <div
        className={`rounded-xl transition-colors duration-200 p-3 relative ${
          isHovered ? 'bg-white/10' : 'bg-transparent'
        }`}
      >
        {/* Thumbnail Container with Stack Effect */}
        <div className="relative w-full aspect-video mb-3">
          {/* Stack Background Layers - Twinkle Design System */}
          <div className="absolute -top-1 -right-1 w-full h-full bg-zinc-800 rounded-xl z-0" />
          <div className="absolute -top-2 -right-2 w-full h-full bg-zinc-800 rounded-xl z-0" />
          
          {/* Main Thumbnail */}
          <div className="relative w-full h-full aspect-video bg-surface rounded-xl overflow-hidden">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={playlist.title}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface" />
            )}
          </div>

          {/* Price/Subscription Label - Top Right Corner (Only show if user doesn't have access) */}
          {!hasAccess && (playlist.price || playlist.isSubscription) && (
            <div className="absolute top-2 right-2 z-30">
              {playlist.isSubscription ? (
                <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
                  <Crown className="h-3 w-3" />
                  <span>Subscription</span>
                </div>
              ) : playlist.price ? (
                <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
                  <Lock className="h-3 w-3" />
                  <span>{playlist.price}</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Playlist Type Label - Bottom Right Corner (Same Twinkle Pill Style) */}
          <div className="absolute bottom-2 right-2 z-30">
            <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-xs font-semibold">
              {playlist.type}
            </div>
          </div>
        </div>

        {/* Playlist Info */}
        <div className="flex items-start gap-3">
          {/* Column 1: Avatar placeholder (optional) */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center" />
          </div>

          {/* Column 2: Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-text-primary line-clamp-2 mb-1 leading-5">
              {playlist.title}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/70">
              <span className="line-clamp-1">{playlist.creatorName}</span>
              <span>•</span>
              <span>{playlist.videoCount} videos</span>
              {playlist.sections.length > 0 && (
                <>
                  <span>•</span>
                  <span>{playlist.sections.length} sections</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

