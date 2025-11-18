'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Video } from '@/types';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideo() {
      if (!params.id || typeof params.id !== 'string') return;
      
      try {
        const response = await fetch(`/api/videos/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setVideo(data.video);
          
          // Load related videos (same creator or similar category)
          const relatedResponse = await fetch('/api/videos?limit=10');
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            setRelatedVideos(relatedData.videos.filter((v: Video) => v.id !== params.id).slice(0, 5));
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading video:', error);
      } finally {
        setLoading(false);
      }
    }
    loadVideo();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-text-secondary">Loading video...</div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <VideoPlayer videoUrl={video.videoUrl} autoPlay />
          
          <div className="mt-4">
            <h1 className="text-xl font-semibold mb-2 text-text-primary">{video.title}</h1>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-text-secondary">
                {video.views.toLocaleString()} views • {new Date(video.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-surface rounded-lg mb-4">
              <Link href={`/creator/${video.userId}`}>
                  {video.user?.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.user.profileImageUrl}
                      alt={video.user.name || 'Creator'}
                      className="w-12 h-12 rounded-full"
                    />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                    <User className="h-6 w-6 text-text-secondary" />
                  </div>
                )}
              </Link>
              <div className="flex-1">
                <Link href={`/creator/${video.userId}`}>
                  <h3 className="font-medium text-text-primary hover:text-accent">{video.user?.name || 'Unknown Creator'}</h3>
                </Link>
                <p className="text-sm text-text-secondary">
                  {Math.floor(Math.random() * 10000).toLocaleString()} subscribers
                </p>
              </div>
              <Button variant="default" className="bg-accent hover:bg-accent/90">
                Subscribe
              </Button>
            </div>
            
            <div className="p-4 bg-surface rounded-lg">
              <p className="text-sm text-text-primary whitespace-pre-wrap">{video.description || 'No description provided.'}</p>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 text-text-primary">Recommended</h2>
          <div className="space-y-4">
            {relatedVideos.map((relatedVideo) => (
              <Link
                key={relatedVideo.id}
                href={`/watch/${relatedVideo.id}`}
                className="flex gap-3 group"
              >
                <div className="relative w-40 h-24 bg-surface rounded-lg overflow-hidden flex-shrink-0">
                  {relatedVideo.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                      src={relatedVideo.thumbnailUrl}
                      alt={relatedVideo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-8 w-8 text-text-secondary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-text-primary line-clamp-2 group-hover:text-accent">
                    {relatedVideo.title}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    {relatedVideo.user?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {relatedVideo.views.toLocaleString()} views
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
