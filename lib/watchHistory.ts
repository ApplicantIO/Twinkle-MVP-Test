// Watch history utilities for tracking video progress and playlist watch state

export interface WatchHistoryEntry {
  videoId: string;
  playlistId?: string;
  lastWatchedAt: number; // timestamp
  progress: number; // seconds watched
  videoDuration?: number; // total video duration in seconds
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
  
  // Keep only the last 100 entries to prevent localStorage from growing too large
  const sortedHistory = history.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
  const limitedHistory = sortedHistory.slice(0, 100);
  
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

