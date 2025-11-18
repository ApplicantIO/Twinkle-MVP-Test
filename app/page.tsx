'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Video } from '@/types';
import { Play } from 'lucide-react';

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideos() {
      try {
        const response = await fetch('/api/videos');
        if (response.ok) {
          const data = await response.json();
          setVideos(data.videos || []);
        }
      } catch (error) {
        console.error('Error loading videos:', error);
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-text-secondary">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6 text-text-primary">Recommended</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos.map((video) => (
          <Link
            key={video.id}
            href={`/watch/${video.id}`}
            className="group cursor-pointer"
          >
            <div className="relative aspect-video bg-surface rounded-lg overflow-hidden mb-2">
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface">
                  <Play className="h-12 w-12 text-text-secondary" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-2">
               {video.user?.profileImageUrl && (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img
                   src={video.user.profileImageUrl}
                   alt={video.user.name || 'Creator'}
                   className="w-9 h-9 rounded-full flex-shrink-0"
                 />
               )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {video.user?.name || 'Unknown Creator'}
                </p>
                <p className="text-xs text-text-secondary">
                  {video.views.toLocaleString()} views
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {videos.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <p>No videos available yet. Be the first to upload!</p>
        </div>
      )}
    </div>
  );
}
