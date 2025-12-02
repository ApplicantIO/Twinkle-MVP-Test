'use client';

import { usePathname } from 'next/navigation';
import { useMiniplayer } from '@/contexts/MiniplayerContext';
import { VideoPlayer } from '@/components/VideoPlayer';

/**
 * MiniplayerVideoPlayer component
 * Renders the VideoPlayer in miniplayer mode when:
 * - isMiniplayerActive is true
 * - User is NOT on the /watch/[id] route
 */
export function MiniplayerVideoPlayer() {
  const pathname = usePathname();
  const { isMiniplayerActive, miniplayerVideo, miniplayerProgress, currentVideoUrl, currentThumbnailUrl } = useMiniplayer();

  // Don't render if:
  // 1. Miniplayer is not active
  // 2. User is on the watch page (VideoPlayer is rendered there instead)
  // 3. Video data is missing
  if (!isMiniplayerActive || pathname?.startsWith('/watch/') || !miniplayerVideo || !currentVideoUrl) {
    return null;
  }

  return (
    <VideoPlayer
      videoUrl={currentVideoUrl}
      autoPlay
      thumbnailUrl={currentThumbnailUrl || undefined}
      video={miniplayerVideo}
      onProgressUpdate={() => {
        // Progress is managed by the VideoPlayer component itself
      }}
    />
  );
}

