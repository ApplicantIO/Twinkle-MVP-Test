'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Video } from '@/types';
import { Play, User as UserIcon } from 'lucide-react';

export default function CreatorProfilePage() {
  const params = useParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCreatorData() {
      if (!params.id || typeof params.id !== 'string') return;
      
      try {
        // Load creator videos
        const videosResponse = await fetch(`/api/videos?userId=${params.id}`);
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          setVideos(videosData.videos || []);
          
          // Get creator info from first video
          if (videosData.videos && videosData.videos.length > 0) {
            // In a real app, you'd fetch creator data separately
            // For now, we'll use the user data from videos
          }
        }
      } catch (error) {
        console.error('Error loading creator data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCreatorData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-text-secondary">Loading...</div>
      </div>
    );
  }

  const firstVideo = videos[0];
  const creatorName = firstVideo?.user?.name || 'Unknown Creator';
  const creatorPhoto = firstVideo?.user?.profileImageUrl;

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="h-48 bg-surface w-full"></div>
      
      <div className="max-w-7xl mx-auto px-8 -mt-16">
        {/* Creator Info */}
        <div className="flex items-end gap-4 mb-8">
            {creatorPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creatorPhoto}
              alt={creatorName}
              className="w-32 h-32 rounded-full border-4 border-background"
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-background bg-surface flex items-center justify-center">
              <UserIcon className="h-16 w-16 text-text-secondary" />
            </div>
          )}
          <div className="pb-4">
            <h1 className="text-2xl font-semibold text-text-primary mb-2">{creatorName}</h1>
            {firstVideo?.user && 'role' in firstVideo.user && firstVideo.user.role === 'creator' && (
              <span className="inline-block px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium">
                Approved Creator
              </span>
            )}
            <p className="text-text-secondary mt-2">
              {Math.floor(Math.random() * 10000).toLocaleString()} subscribers
            </p>
          </div>
        </div>

        {/* Videos Grid */}
        <h2 className="text-xl font-semibold mb-4 text-text-primary">Videos</h2>
        {videos.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p>This creator hasn&apos;t uploaded any videos yet.</p>
          </div>
        ) : (
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
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-12 w-12 text-text-secondary" />
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-sm text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {video.views.toLocaleString()} views
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
