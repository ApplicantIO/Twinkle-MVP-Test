'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HistoryVideo } from '@/app/history/HistoryPageClient';
import { Play, MoreVertical, Check } from 'lucide-react';
import { formatDuration, formatRelativeTime, formatViews } from '@/lib/utils';

interface HistoryVideoItemProps {
  video: HistoryVideo;
}

export default function HistoryVideoItem({ video }: HistoryVideoItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const duration = video.duration || video.historyEntry.videoDuration || 0;

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group flex flex-col md:flex-row items-start gap-6 rounded-xl transition-all duration-200 hover:bg-white/5 p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Side - Thumbnail (40% Width) */}
      <div className="relative w-full md:w-[40%] flex-shrink-0 aspect-video bg-surface rounded-xl overflow-hidden">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isHovered ? 'scale-[1.02]' : 'scale-100'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-12 w-12 text-text-secondary" />
          </div>
        )}
        
        {/* Duration Badge - Bottom Right Corner */}
        {duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Right Side - Metadata */}
      <div className="flex-1 min-w-0 pl-6 flex flex-col gap-2 items-start">
        {/* Title Row - Title + More Button */}
        <div className="flex justify-between items-start w-full gap-4">
          <h3 className="text-xl font-semibold text-white line-clamp-2 leading-snug group-hover:text-white/90 flex-1 min-w-0">
            {video.title}
          </h3>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="text-text-secondary hover:text-white transition-colors flex-shrink-0 p-1 rounded-full hover:bg-white/10"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Row - Views • Watched time ago */}
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-white/70">
          <span>{formatViews(video.views)} views</span>
          <span>•</span>
          <span>{formatRelativeTime(video.watchedAt)}</span>
        </div>

        {/* Creator Row - Small avatar (h-6 w-6) + Channel Name */}
        <div className="flex items-center gap-2">
          {video.user?.profileImageUrl ? (
            <img
              src={video.user.profileImageUrl}
              alt={video.user.name || 'Creator'}
              className="h-6 w-6 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
              <Play className="h-3 w-3 text-text-secondary" />
            </div>
          )}
          <span className="text-sm text-white/70">
            {video.user?.name || 'Unknown Creator'}
          </span>
          {video.user && 'role' in video.user && video.user.role === 'creator' && (
            <Check className="h-4 w-4 text-accent flex-shrink-0" />
          )}
        </div>

        {/* Description Snippet - One line preview */}
        {video.description && (
          <p className="text-sm text-white/60 line-clamp-1">
            {video.description}
          </p>
        )}
      </div>
    </Link>
  );
}
