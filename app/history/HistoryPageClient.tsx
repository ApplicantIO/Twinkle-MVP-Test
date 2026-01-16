'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Video } from '@/types';
import { WatchHistoryEntry, getVideoWatchHistory } from '@/lib/watchHistory';
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isHistoryPaused, setIsHistoryPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load history entries from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const history = JSON.parse(localStorage.getItem('watchHistory') || '[]') as WatchHistoryEntry[];
    const paused = localStorage.getItem('watchHistoryPaused') === 'true';
    
    setHistoryEntries(history.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt));
    setIsHistoryPaused(paused);
  }, []);

  // Fetch video data for history entries
  useEffect(() => {
    async function fetchVideos() {
      if (historyEntries.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const videoIds = historyEntries.map(entry => entry.videoId);
        const videoPromises = videoIds.map(async (videoId) => {
          try {
            const response = await fetch(`/api/videos/${videoId}`, { headers });
            if (response.ok) {
              const data = await response.json();
              return data.video;
            }
          } catch (error) {
            console.error(`Error fetching video ${videoId}:`, error);
          }
          return null;
        });

        const fetchedVideos = (await Promise.all(videoPromises)).filter(Boolean) as Video[];
        setVideos(fetchedVideos);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [historyEntries]);

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

    // Apply date filter
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filtered = filtered.filter(video => {
        const watchedDate = new Date(video.watchedAt);
        watchedDate.setHours(0, 0, 0, 0);
        return watchedDate >= filterDate && watchedDate < nextDay;
      });
    }

    return filtered;
  }, [historyVideos, activeFilter, searchQuery, selectedDate]);

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

  const handleClearHistory = () => {
    localStorage.removeItem('watchHistory');
    setHistoryEntries([]);
    setHistoryVideos([]);
    setSelectedDate(null);
  };

  const handlePauseHistory = (paused: boolean) => {
    setIsHistoryPaused(paused);
    localStorage.setItem('watchHistoryPaused', String(paused));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-text-secondary">Please login to view your watch history.</div>
      </div>
    );
  }

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
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
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
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column - Main History Feed (70-75%) */}
        <div className="flex-1 min-w-0 lg:w-[72%]">
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

        {/* Right Sidebar - Management Tools (25-30%) */}
        <div className="w-full lg:w-[28%] flex-shrink-0">
          <HistoryManagementSidebar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onClearHistory={handleClearHistory}
            isHistoryPaused={isHistoryPaused}
            onPauseHistory={handlePauseHistory}
          />
        </div>
      </div>
    </div>
  );
}
