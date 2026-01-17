// Watch history utilities for tracking video progress and playlist watch state

export interface WatchHistoryEntry {
  videoId: string;
  playlistId?: string;
  lastWatchedAt: number; // timestamp
  progress: number; // seconds watched
  videoDuration?: number; // total video duration in seconds
}

export interface WatchHistoryDatabaseEntry {
  id: string;
  userId: string;
  videoId: string;
  playlistId?: string | null;
  progress: number;
  videoDuration?: number | null;
  lastWatchedAt: Date;
}

/**
 * Get watch history for a specific video
 */
export function getVideoWatchHistory(videoId: string): WatchHistoryEntry | null {
  if (typeof window === 'undefined') return null;
  
  const history = JSON.parse(localStorage.getItem('watchHistory') || '[]') as WatchHistoryEntry[];
  return history.find(entry => entry.videoId === videoId) || null;
}

/**
 * Get the last watched video in a playlist
 */
export function getLastWatchedVideoInPlaylist(playlistId: string): WatchHistoryEntry | null {
  if (typeof window === 'undefined') return null;
  
  const history = JSON.parse(localStorage.getItem('watchHistory') || '[]') as WatchHistoryEntry[];
  
  // Filter entries for this playlist, sorted by lastWatchedAt (most recent first)
  const playlistEntries = history
    .filter(entry => entry.playlistId === playlistId)
    .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
  
  return playlistEntries.length > 0 ? playlistEntries[0] : null;
}

/**
 * Update watch history for a video
 */
export function updateWatchHistory(videoId: string, progress: number, playlistId?: string, videoDuration?: number): void {
  if (typeof window === 'undefined') return;
  
  const history = JSON.parse(localStorage.getItem('watchHistory') || '[]') as WatchHistoryEntry[];
  
  // Find existing entry
  const existingIndex = history.findIndex(entry => entry.videoId === videoId);
  
  const entry: WatchHistoryEntry = {
    videoId,
    playlistId,
    lastWatchedAt: Date.now(),
    progress,
    videoDuration,
  };
  
  if (existingIndex >= 0) {
    // Update existing entry
    history[existingIndex] = entry;
  } else {
    // Add new entry
    history.push(entry);
  }
  
  // Keep only the last 50 entries for guests (as per requirements)
  const sortedHistory = history.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
  const limitedHistory = sortedHistory.slice(0, 50);
  
  localStorage.setItem('watchHistory', JSON.stringify(limitedHistory));
  
  // Dispatch custom event for cross-component sync
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('watchHistoryUpdated', { detail: { videoId, playlistId } }));
  }
}

/**
 * Check if user has started watching a playlist
 */
export function hasStartedPlaylist(playlistId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const history = JSON.parse(localStorage.getItem('watchHistory') || '[]') as WatchHistoryEntry[];
  return history.some(entry => entry.playlistId === playlistId);
}

/**
 * Playlist progress tracking interface
 */
export interface PlaylistProgress {
  playlistId: string;
  lastVideoId: string;
  timestamp?: number; // Optional: current time in the video (seconds)
  lastAccessedAt: number; // When the video was last accessed
}

/**
 * Get the last watched video for a playlist (using dedicated key)
 */
export function getPlaylistProgress(playlistId: string): PlaylistProgress | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `twinkle_playlist_progress_${playlistId}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data) as PlaylistProgress;
    }
  } catch (error) {
    console.error('Error reading playlist progress:', error);
  }
  
  return null;
}

/**
 * Save the last watched video for a playlist (using dedicated key)
 */
export function savePlaylistProgress(playlistId: string, lastVideoId: string, timestamp?: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `twinkle_playlist_progress_${playlistId}`;
    const progress: PlaylistProgress = {
      playlistId,
      lastVideoId,
      timestamp,
      lastAccessedAt: Date.now(),
    };
    
    localStorage.setItem(key, JSON.stringify(progress));
    
    // Dispatch custom event for cross-component sync
    window.dispatchEvent(new CustomEvent('playlistProgressUpdated', { detail: { playlistId, lastVideoId } }));
  } catch (error) {
    console.error('Error saving playlist progress:', error);
  }
}

/**
 * Save watch history to database (for logged-in users)
 */
export async function saveWatchHistoryToDatabase(data: {
  videoId: string;
  userId: string;
  progress: number;
  duration?: number;
  playlistId?: string;
}): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        videoId: data.videoId,
        progress: data.progress,
        videoDuration: data.duration,
        playlistId: data.playlistId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to save history' }));
      const errorMessage = errorData.error || 'Failed to save history';
      
      // Check if it's a service unavailable error (table doesn't exist) - don't throw, just fallback
      if (response.status === 503 || errorData.code === 'MIGRATION_NEEDED') {
        // Fallback to localStorage silently for migration issues
        updateWatchHistory(data.videoId, data.progress, data.playlistId, data.duration);
        if (process.env.NODE_ENV === 'development') {
          console.warn('Watch history table not available, using localStorage fallback');
        }
        return;
      }
      
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    // If error is not about migration, log it and fallback to localStorage
    if (error?.message && !error.message.includes('MIGRATION_NEEDED')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error saving watch history to database, using localStorage fallback:', error);
      }
      // Fallback to localStorage for any save errors
      updateWatchHistory(data.videoId, data.progress, data.playlistId, data.duration);
    }
    // Don't re-throw - we've handled it with localStorage fallback
  }
}

/**
 * Get watch history from database (for logged-in users)
 */
export async function getWatchHistoryFromDatabase(userId?: string): Promise<WatchHistoryDatabaseEntry[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return [];
    }

    const response = await fetch('/api/history', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('Error fetching watch history from database:', error);
    return [];
  }
}
