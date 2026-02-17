'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Video } from '@/types';
import { Play, User as UserIcon } from 'lucide-react';
import { BannerSection } from '@/components/creator/BannerSection';
import { CreatorInfoSection } from '@/components/creator/CreatorInfoSection';
import { ProfileTabsRow, type ProfileTabId } from '@/components/creator/ProfileTabsRow';

export default function CreatorProfilePage() {
  const params = useParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTabId>('home');
  const [subscribersCount] = useState(() => Math.floor(Math.random() * 10000));

  useEffect(() => {
    async function loadCreatorData() {
      if (!params.id || typeof params.id !== 'string') return;

      try {
        const videosResponse = await fetch(`/api/videos?userId=${params.id}`);
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          setVideos(videosData.videos || []);
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
      <div className="w-full min-w-0 max-w-[1600px] mx-auto px-5 py-8">
        <div className="text-center text-text-secondary">Loading...</div>
      </div>
    );
  }

  const firstVideo = videos[0];
  const creatorName = firstVideo?.user?.name || 'Unknown Creator';
  const creatorPhoto = firstVideo?.user?.profileImageUrl ?? null;
  const username = typeof params.id === 'string' ? params.id : 'creator';
  const description =
    'Welcome to my channel. Here you will find videos and content I create. Subscribe to stay updated.';

  return (
    <div className="min-h-screen w-full min-w-0 flex-1">
      {/* Main container: centered, grows when sidebar collapses, 20px horizontal padding */}
      <div className="w-full max-w-[1600px] mx-auto px-5">
        {/* Block 1 — Banner */}
        <BannerSection />

        {/* Block 2 — Info section (3 columns) */}
        <div className="py-6">
          <CreatorInfoSection
            creatorName={creatorName}
            username={username}
            subscribersCount={subscribersCount}
            videoCount={videos.length}
            description={description}
            creatorPhoto={creatorPhoto}
          />
        </div>

        {/* Block 3 — Tabs row */}
        <ProfileTabsRow activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab content: Videos grid (for Home / Videos tab) */}
        <div className="pt-6 pb-8">
          {activeTab === 'videos' || activeTab === 'home' ? (
            <>
              <h2 className="text-xl font-semibold mb-4 text-text-primary">Videos</h2>
              {videos.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <p>This creator hasn&apos;t uploaded any videos yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-2 lg:gap-3">
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
            </>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              <p>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
