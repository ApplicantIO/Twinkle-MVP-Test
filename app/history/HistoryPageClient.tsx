'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Video } from '@/types';
import { WatchHistoryEntry } from '@/lib/watchHistory';
import HistoryVideoItem from '@/components/history/HistoryVideoItem';
import HistoryManagementSidebar from '@/components/history/HistoryManagementSidebar';
import { formatHistoryDate } from '@/lib/utils';

export interface HistoryVideo extends Video {
  historyEntry: WatchHistoryEntry;
  watchedAt: Date;
}

type FilterType = 'all' | 'videos' | 'musics' | 'podcasts' | 'courses';

export default function HistoryPageClient() {
  const { user } = useAuth();
  const [historyEntries, setHistoryEntries] = useState<WatchHistoryEntry[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [historyVideos, setHistoryVideos] = useState<HistoryVideo[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isHistoryPaused, setIsHistoryPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Track which video IDs we've already fetched to avoid duplicate requests
  const fetchedVideoIdsRef = useRef<Set<string>>(new Set());

  // Load history entries (from DB if logged in, localStorage if guest)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadHistory = async () => {
      const paused = localStorage.getItem('watchHistoryPaused') === 'true';
      setIsHistoryPaused(paused);

      if (user) {
        // Logged in: Fetch from database
        try {
          const token = localStorage.getItem('token');
          const headers: HeadersInit = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch('/api/history', { headers });
          if (response.ok) {
            const data = await response.json();
            const dbHistory = data.history || [];
            
            // Extract videos from DB response (includes video data)
            if (dbHistory.length > 0) {
              const videosFromDb = dbHistory
                .map((entry: any) => entry.video)
                .filter(Boolean) as Video[];
              
              // Set videos directly from DB (they include all necessary data)
              if (videosFromDb.length > 0) {
                setVideos(videosFromDb);
                // Mark these videos as fetched to avoid refetching
                videosFromDb.forEach(video => fetchedVideoIdsRef.current.add(video.id));
              }
            }
            
            // Convert DB entries to WatchHistoryEntry format
            // For logged-in users, database is the source of truth - don't merge localStorage
            // to prevent deleted entries from reappearing across devices
            const convertedHistory: WatchHistoryEntry[] = dbHistory.map((entry: any) => ({
              videoId: entry.videoId,
              playlistId: entry.playlistId || undefined,
              lastWatchedAt: new Date(entry.lastWatchedAt).getTime(),
              progress: entry.progress,
              videoDuration: entry.videoDuration || undefined,
            }));
            
            // Sort by lastWatchedAt (most recent first)
            const sortedHistory = convertedHistory.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
            setHistoryEntries(sortedHistory);
          } else {
            // Handle different error statuses gracefully
            if (response.status === 401) {
              // Unauthorized - user might not be logged in, use localStorage fallback
              const localHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]') as WatchHistoryEntry[];
              setHistoryEntries(localHistory.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt));
            } else if (response.status === 503) {
              // Service Unavailable - table doesn't exist, use localStorage fallback
              const localHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]') as WatchHistoryEntry[];
              setHistoryEntries(localHistory.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt));
              if (process.env.NODE_ENV === 'development') {
                console.warn('Watch history table not found. Using localStorage fallback. Run: npx prisma db push');
              }
            } else {
              // Other errors (500, network, etc.) - fallback to localStorage without throwing
              // Only log in development to reduce console noise
              if (process.env.NODE_ENV === 'development') {
                console.warn(`Failed to fetch history: ${response.status} ${response.statusText}. Using localStorage fallback.`);
              }
              const localHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]') as WatchHistoryEntry[];
              setHistoryEntries(localHistory.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt));
            }
          }
        } catch (error) {
          // Only log in development to reduce console noise
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error loading history from database, using localStorage fallback:', error);
          }
          // Fallback to localStorage
          const localHistory = JSON.parse(localStorage.getItem('watchHistory') || '[]') as WatchHistoryEntry[];
          setHistoryEntries(localHistory.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt));
        }
      } else {
        // Guest: Load from localStorage (limit to last 50)
        const history = JSON.parse(localStorage.getItem('watchHistory') || '[]') as WatchHistoryEntry[];
        const sortedHistory = history.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt).slice(0, 50);
        setHistoryEntries(sortedHistory);
      }
    };

    loadHistory();

    // Listen for real-time updates
    const handleHistoryUpdate = () => {
      loadHistory();
    };

    window.addEventListener('watchHistoryUpdated', handleHistoryUpdate);
    
    return () => {
      window.removeEventListener('watchHistoryUpdated', handleHistoryUpdate);
    };
  }, [user]);

  // Fetch video data for history entries (only for entries without video data)
  useEffect(() => {
    async function fetchVideos() {
      if (historyEntries.length === 0) {
        setLoading(false);
        return;
      }

      // Get unique video IDs from history entries
      const requiredVideoIds = [...new Set(historyEntries.map(entry => entry.videoId))];

      // Check which videos we haven't fetched yet using ref
      const missingVideoIds = requiredVideoIds.filter(id => !fetchedVideoIdsRef.current.has(id));

      // If no missing videos, don't fetch
      if (missingVideoIds.length === 0) {
        setLoading(false);
        return;
      }

      // Mark these as being fetched
      missingVideoIds.forEach(id => fetchedVideoIdsRef.current.add(id));

      setLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Fetch only missing videos in parallel
        const videoPromises = missingVideoIds.map(async (videoId) => {
          try {
            const response = await fetch(`/api/videos/${videoId}`, { headers });
            if (response.ok) {
              const data = await response.json();
              return data.video;
            } else {
              // Remove from ref if fetch failed (non-OK response) so we can retry later
              fetchedVideoIdsRef.current.delete(videoId);
              return null;
            }
          } catch (error) {
            console.error(`Error fetching video ${videoId}:`, error);
            // Remove from ref if fetch failed (exception) so we can retry later
            fetchedVideoIdsRef.current.delete(videoId);
            return null;
          }
        });

        const fetchedVideos = (await Promise.all(videoPromises)).filter(Boolean) as Video[];
        
        // Update videos state, avoiding duplicates
        setVideos(prev => {
          const existingIds = new Set(prev.map(v => v.id));
          const newVideos = fetchedVideos.filter(v => !existingIds.has(v.id));
          return [...prev, ...newVideos];
        });
      } catch (error) {
        console.error('Error fetching videos:', error);
        // Remove from ref on error so we can retry later
        missingVideoIds.forEach(id => fetchedVideoIdsRef.current.delete(id));
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [historyEntries]); // Only depend on historyEntries - videos state is managed internally

  // Combine history entries with video data
  useEffect(() => {
    const combined = historyEntries
      .map(entry => {
        const video = videos.find(v => v.id === entry.videoId);
        if (!video) return null;

        return {
          ...video,
          historyEntry: entry,
          watchedAt: new Date(entry.lastWatchedAt),
        } as HistoryVideo;
      })
      .filter(Boolean) as HistoryVideo[];

    setHistoryVideos(combined);
  }, [historyEntries, videos]);

  // Filter and search logic
  const filteredVideos = useMemo(() => {
    let filtered = historyVideos;

    // Apply type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(video => {
        const category = video.category?.toLowerCase() || '';
        switch (activeFilter) {
          case 'videos':
            return !['music', 'podcast', 'course'].some(t => category.includes(t));
          case 'musics':
            return category.includes('music');
          case 'podcasts':
            return category.includes('podcast');
          case 'courses':
            return category.includes('course') || category.includes('education');
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.description?.toLowerCase().includes(query) ||
        video.user?.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [historyVideos, activeFilter, searchQuery]);

  // Group videos by date
  const groupedVideos = useMemo(() => {
    const groups: Record<string, HistoryVideo[]> = {};

    filteredVideos.forEach(video => {
      const dateKey = formatHistoryDate(video.watchedAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(video);
    });

    return groups;
  }, [filteredVideos]);

  // Note: Removed the user guard - guests can now view their localStorage history
  // The history loading logic (lines 128-133) handles guests by loading from localStorage

  const handleClearHistory = async () => {
    let dbDeleteSucceeded = true;
    
    if (user) {
      // Logged in: Clear from database
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('/api/history', {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          // Check if deletion succeeded
          if (!response.ok) {
            dbDeleteSucceeded = false;
            if (process.env.NODE_ENV === 'development') {
              console.error('Failed to clear history from database:', response.status, response.statusText);
            }
          }
        } else {
          // User is logged in but no token - treat as failed deletion to maintain consistency
          dbDeleteSucceeded = false;
          if (process.env.NODE_ENV === 'development') {
            console.warn('User logged in but no token found, skipping database deletion to maintain consistency');
          }
        }
      } catch (error) {
        dbDeleteSucceeded = false;
        if (process.env.NODE_ENV === 'development') {
          console.error('Error clearing history from database:', error);
        }
      }
    }
    
    // Only clear localStorage if database deletion succeeded (or user is guest)
    // This prevents state sync issues where DB still has data but localStorage is empty
    if (dbDeleteSucceeded || !user) {
      localStorage.removeItem('watchHistory');
      setHistoryEntries([]);
      setHistoryVideos([]);
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('watchHistoryUpdated'));
      }
    } else {
      // Database deletion failed - don't clear localStorage to maintain consistency
      // Show error message to user (could add toast notification here)
      if (process.env.NODE_ENV === 'development') {
        console.warn('Database deletion failed, keeping localStorage intact to maintain consistency');
      }
    }
  };

  const handlePauseHistory = (paused: boolean) => {
    setIsHistoryPaused(paused);
    localStorage.setItem('watchHistoryPaused', String(paused));
    // Dispatch event to update sidebar indicator
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('watchHistoryUpdated'));
    }
  };

  // Allow both logged-in users and guests to view history
  // Guests see their localStorage history (last 50 entries)
  // Logged-in users see their database history merged with localStorage

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-text-secondary">Loading history...</div>
      </div>
    );
  }

  const filterTabs: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'videos', label: 'Videos' },
    { id: 'musics', label: 'Musics' },
    { id: 'podcasts', label: 'Podcasts' },
    { id: 'courses', label: 'Courses' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 md:px-4 lg:px-6 py-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-text-primary mb-3">Watch history</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-2">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.id
                ? 'bg-white text-black'
                : 'bg-white/10 text-text-secondary hover:bg-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column - Main History Feed (flex-1 takes remaining space) */}
        <div className="flex-1 min-w-0">
          {Object.keys(groupedVideos).length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <p>Your watch history is empty.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedVideos).map(([dateLabel, videos]) => (
                <div key={dateLabel}>
                  {/* Date Separator */}
                  <h2 className="text-sm font-medium text-text-secondary mb-4">{dateLabel}</h2>
                  
                  {/* Video List */}
                  <div className="space-y-2">
                    {videos.map(video => (
                      <HistoryVideoItem key={`${video.id}-${video.historyEntry.lastWatchedAt}`} video={video} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar - Management Tools (Fixed Width) */}
        <div className="w-full lg:w-[280px] flex-shrink-0">
                  <HistoryManagementSidebar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onClearHistory={handleClearHistory}
                    isHistoryPaused={isHistoryPaused}
                    onPauseHistory={handlePauseHistory}
                  />
        </div>
      </div>
    </div>
  );
}
