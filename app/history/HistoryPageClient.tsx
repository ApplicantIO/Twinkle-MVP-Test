'use client';

import { useEffect, useMemo, useState } from 'react';
import HistoryVideoItem from '@/components/history/HistoryVideoItem';

interface HistoryApiEntry {
  id: string;
  progress: number;
  videoDuration: number | null;
  lastWatchedAt: string;
  video: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    duration: number | null;
    views: number | null;
    user: {
      id: string;
      name: string | null;
      profileImageUrl: string | null;
    } | null;
  };
}

export interface HistoryVideo {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  views: number;
  watchedAt: string;
  user?: {
    id: string;
    name?: string | null;
    profileImageUrl?: string | null;
    role?: 'viewer' | 'creator' | 'admin';
  } | null;
  historyEntry: {
    progress: number;
    videoDuration?: number | null;
  };
}

export default function HistoryPageClient() {
  const [history, setHistory] = useState<HistoryVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          setHistory([]);
          return;
        }

        const response = await fetch('/api/history', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setHistory([]);
          return;
        }

        const data = (await response.json()) as { history?: HistoryApiEntry[] };
        const normalizedHistory = (data.history ?? []).map((entry) => ({
          id: entry.video.id,
          title: entry.video.title,
          description: entry.video.description,
          thumbnailUrl: entry.video.thumbnailUrl,
          duration: entry.video.duration,
          views: entry.video.views ?? 0,
          watchedAt: entry.lastWatchedAt,
          user: entry.video.user
            ? {
                id: entry.video.user.id,
                name: entry.video.user.name,
                profileImageUrl: entry.video.user.profileImageUrl,
              }
            : null,
          historyEntry: {
            progress: entry.progress,
            videoDuration: entry.videoDuration,
          },
        }));

        setHistory(normalizedHistory);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchHistory();
  }, []);

  const content = useMemo(() => {
    if (isLoading) {
      return <p className="text-text-secondary">Loading history...</p>;
    }

    if (history.length === 0) {
      return <p className="text-text-secondary">No watch history yet.</p>;
    }

    return (
      <div className="space-y-2">
        {history.map((video) => (
          <HistoryVideoItem key={`${video.id}-${video.watchedAt}`} video={video} />
        ))}
      </div>
    );
  }, [history, isLoading]);

  return (
    <div className="px-2 md:px-4 lg:px-6 py-6 md:py-8">
      <h1 className="text-2xl font-semibold mb-6 text-text-primary">Watch History</h1>
      {content}
    </div>
  );
}
