'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateWatchHistory } from '@/lib/watchHistory';
import { saveWatchHistoryToDatabase } from '@/lib/watchHistory';

interface UseWatchHistoryTrackerProps {
  videoId: string;
  video?: {
    id: string;
    duration?: number;
  };
  currentTime: number;
  isPlaying: boolean;
  playlistId?: string;
  enabled?: boolean; // If false, tracking is disabled (e.g., when in miniplayer)
}

const WATCH_THRESHOLD_SECONDS = 5; // Minimum seconds to watch before adding to history
const UPDATE_INTERVAL_MS = 5000; // Update history every 5 seconds

/**
 * Hook to track video watch history
 * Triggers after user watches for more than 5 seconds
 */
export function useWatchHistoryTracker({
  videoId,
  video,
  currentTime,
  isPlaying,
  playlistId,
  enabled = true, // Default to enabled for backward compatibility
}: UseWatchHistoryTrackerProps) {
  const { user } = useAuth();
  const hasReachedThresholdRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if history is paused
  const isHistoryPaused = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('watchHistoryPaused') === 'true';
  };

  // Save watch history (DB or localStorage)
  const saveWatchHistory = useCallback(async (progress: number) => {
    if (isHistoryPaused()) return;
    if (!videoId || !video || !video.id) return;

    const duration = video.duration;

    if (user && user.id) {
      // Logged in: Save to database (function handles fallback internally)
      await saveWatchHistoryToDatabase({
        videoId: video.id,
        userId: user.id,
        progress: Math.floor(progress), // Ensure integer
        duration: duration ? Math.floor(duration) : undefined,
        playlistId,
      });
      // Note: saveWatchHistoryToDatabase now handles fallback to localStorage internally
      // and doesn't throw errors, so we don't need try-catch here
    } else {
      // Guest: Save to localStorage (limit to last 50)
      updateWatchHistory(video.id, progress, playlistId, duration);
    }
  }, [user, videoId, video, playlistId]);

  // Start tracking when video plays and reaches threshold
  useEffect(() => {
    // If tracking is disabled, don't track (e.g., when in miniplayer mode)
    if (!enabled) {
      // Clear any existing tracking intervals
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      hasReachedThresholdRef.current = false;
      return;
    }

    if (!isPlaying || !videoId || !video) {
      // Clear tracking if video is paused or not available
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      return;
    }

    // Check if we've reached the threshold (watched for 5+ seconds)
    if (currentTime >= WATCH_THRESHOLD_SECONDS && !hasReachedThresholdRef.current && video && video.id) {
      hasReachedThresholdRef.current = true;
      // Initial save when threshold is reached
      saveWatchHistory(currentTime);
    }

    // Start interval updates if threshold reached
    if (hasReachedThresholdRef.current) {
      const now = Date.now();
      
      // Only update if enough time has passed since last update
      if (now - lastUpdateTimeRef.current >= UPDATE_INTERVAL_MS) {
        saveWatchHistory(currentTime);
        lastUpdateTimeRef.current = now;
      }

      // Set up interval for periodic updates
      if (!trackingIntervalRef.current && video && video.id) {
        trackingIntervalRef.current = setInterval(() => {
          if (isPlaying && currentTime >= WATCH_THRESHOLD_SECONDS) {
            saveWatchHistory(currentTime);
            lastUpdateTimeRef.current = Date.now();
          }
        }, UPDATE_INTERVAL_MS);
      }
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
    };
  }, [enabled, isPlaying, currentTime, videoId, video, saveWatchHistory]);

  // Reset tracking when video changes
  useEffect(() => {
    hasReachedThresholdRef.current = false;
    lastUpdateTimeRef.current = 0;
    
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, [videoId]);
}
