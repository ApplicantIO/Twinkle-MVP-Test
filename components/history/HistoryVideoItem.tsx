'use client';

import Link from 'next/link';
import { HistoryVideo } from '@/app/history/HistoryPageClient';
import { Play, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface HistoryVideoItemProps {
  video: HistoryVideo;
}

export default function HistoryVideoItem({ video }: HistoryVideoItemProps) {
  const duration = video.duration || video.historyEntry.videoDuration || 0;

  return (
    <Link
      href={`/watch/${video.id}`}
      className="group flex gap-4 rounded-xl p-3 hover:bg-surface/50 transition-colors"
    >
      {/* Thumbnail with Duration */}
      <div className="relative flex-shrink-0 w-48 aspect-video bg-surface rounded-lg overflow-hidden">
        {video.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-12 w-12 text-text-secondary" />
          </div>
        )}
        
        {/* Duration Badge */}
        {duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-text-primary line-clamp-2 group-hover:text-accent transition-colors mb-1">
          {video.title}
        </h3>
        
        <p className="text-sm text-text-secondary mb-2">
          {video.user?.name || 'Unknown Creator'}
        </p>
        
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>{video.views.toLocaleString()} views</span>
        </div>
        
        {video.description && (
          <p className="text-sm text-text-secondary mt-2 line-clamp-1">
            {video.description}
          </p>
        )}
      </div>
    </Link>
  );
}
