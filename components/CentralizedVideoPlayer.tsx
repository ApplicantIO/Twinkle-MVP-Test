'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useMiniplayer } from '@/contexts/MiniplayerContext';
import { VideoPlayer } from '@/components/VideoPlayer';

/**
 * CentralizedVideoPlayer component
 * Renders VideoPlayer in ONE location based on route and miniplayer state:
 * - On /watch/[id]: Portal to placeholder element on watch page (full-size)
 * - Not on /watch/[id] AND isMiniplayerActive: Fixed bottom-right miniplayer
 * - Otherwise: null (not rendered)
 */
export function CentralizedVideoPlayer() {
  const pathname = usePathname();
  const [placeholderElement, setPlaceholderElement] = useState<HTMLElement | null>(null);
  const { 
    isMiniplayerActive, 
    currentWatchVideo, 
    miniplayerVideo, 
    currentVideoId,
    currentVideoUrl,
    currentThumbnailUrl
  } = useMiniplayer();

  const isOnWatchPage = pathname?.startsWith('/watch/');

  // Find placeholder element on watch page (with retry for timing issues)
  useEffect(() => {
    if (isOnWatchPage) {
      const findPlaceholder = () => {
        const element = document.getElementById('video-player-placeholder');
        if (element) {
          setPlaceholderElement(element);
        } else {
          // Retry after a short delay if element not found
          setTimeout(findPlaceholder, 100);
        }
      };
      findPlaceholder();
    } else {
      setPlaceholderElement(null);
    }
  }, [isOnWatchPage, currentWatchVideo]);

  // CRITICAL: Route takes precedence over miniplayer state
  // On watch page: ALWAYS render full-size, ignore miniplayer state
  if (isOnWatchPage) {
    if (!currentWatchVideo || !currentWatchVideo.videoUrl) {
      return null;
    }
    
    // Render via portal into placeholder when ready
    if (placeholderElement) {
      return createPortal(
        <VideoPlayer
          videoUrl={currentWatchVideo.videoUrl}
          autoPlay
          thumbnailUrl={currentWatchVideo.thumbnailUrl || undefined}
          video={currentWatchVideo}
          onProgressUpdate={() => {
            // Progress is managed by the VideoPlayer component itself
          }}
        />,
        placeholderElement
      );
    }
    
    // Wait for placeholder - don't render yet (prevents double render)
    return null;
  }

  // NOT on watch page: Only render if miniplayer is active
  if (!isOnWatchPage && isMiniplayerActive && miniplayerVideo && currentVideoUrl) {
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

  // Otherwise: don't render
  return null;
}

