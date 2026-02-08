'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Video } from '@/types';

const MINIPLAYER_CORNER_KEY = 'twinkle-miniplayer-corner';

export type MiniplayerCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface MiniplayerContextType {
  isMiniplayerActive: boolean;
  miniplayerVideo: Video | null;
  miniplayerProgress: number;
  currentVideoId: string | null;
  currentVideoUrl: string | null;
  currentThumbnailUrl: string | null;
  // Current video on watch page
  currentWatchVideo: Video | null;
  // Draggable corner position (persists across routes)
  miniplayerCorner: MiniplayerCorner;
  setMiniplayerCorner: (corner: MiniplayerCorner) => void;
  setIsMiniplayerActive: (active: boolean) => void;
  setMiniplayerVideo: (video: Video | null) => void;
  setMiniplayerProgress: (progress: number) => void;
  setCurrentWatchVideo: (video: Video | null) => void;
  activateMiniplayer: (video: Video, progress?: number) => void;
  closeMiniplayer: () => void;
}

const MiniplayerContext = createContext<MiniplayerContextType | undefined>(undefined);

const DEFAULT_CORNER: MiniplayerCorner = 'bottom-right';

function loadCornerFromStorage(): MiniplayerCorner {
  if (typeof window === 'undefined') return DEFAULT_CORNER;
  try {
    const stored = localStorage.getItem(MINIPLAYER_CORNER_KEY);
    if (stored && ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(stored)) {
      return stored as MiniplayerCorner;
    }
  } catch {}
  return DEFAULT_CORNER;
}

export function MiniplayerProvider({ children }: { children: ReactNode }) {
  const [isMiniplayerActive, setIsMiniplayerActive] = useState(false);
  const [miniplayerVideo, setMiniplayerVideo] = useState<Video | null>(null);
  const [miniplayerProgress, setMiniplayerProgress] = useState(0);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string | null>(null);
  const [currentWatchVideo, setCurrentWatchVideo] = useState<Video | null>(null);
  const [miniplayerCorner, setMiniplayerCornerState] = useState<MiniplayerCorner>(DEFAULT_CORNER);

  // Load corner from localStorage on mount
  useEffect(() => {
    setMiniplayerCornerState(loadCornerFromStorage());
  }, []);

  const setMiniplayerCorner = (corner: MiniplayerCorner) => {
    setMiniplayerCornerState(corner);
    try {
      localStorage.setItem(MINIPLAYER_CORNER_KEY, corner);
    } catch {}
  };

  const activateMiniplayer = (video: Video, progress: number = 0) => {
    setMiniplayerVideo(video);
    setMiniplayerProgress(progress);
    setCurrentVideoId(video.id);
    setCurrentVideoUrl(video.videoUrl);
    setCurrentThumbnailUrl(video.thumbnailUrl || null);
    setIsMiniplayerActive(true);
  };

  const closeMiniplayer = () => {
    setIsMiniplayerActive(false);
    setMiniplayerVideo(null);
    setMiniplayerProgress(0);
    setCurrentVideoId(null);
    setCurrentVideoUrl(null);
    setCurrentThumbnailUrl(null);
    // Note: Don't clear currentWatchVideo here - it's managed by the watch page
  };

  return (
    <MiniplayerContext.Provider
      value={{
        isMiniplayerActive,
        miniplayerVideo,
        miniplayerProgress,
        currentVideoId,
        currentVideoUrl,
        currentThumbnailUrl,
        currentWatchVideo,
        miniplayerCorner,
        setMiniplayerCorner,
        setIsMiniplayerActive,
        setMiniplayerVideo,
        setMiniplayerProgress,
        setCurrentWatchVideo,
        activateMiniplayer,
        closeMiniplayer,
      }}
    >
      {children}
    </MiniplayerContext.Provider>
  );
}

export function useMiniplayer() {
  const context = useContext(MiniplayerContext);
  if (context === undefined) {
    throw new Error('useMiniplayer must be used within a MiniplayerProvider');
  }
  return context;
}

