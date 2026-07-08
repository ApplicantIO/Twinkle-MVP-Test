'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Video } from '@/types';
import { Play } from 'lucide-react';
import { BannerSection } from '@/components/creator/BannerSection';
import { CreatorInfoSection } from '@/components/creator/CreatorInfoSection';
import { ProfileTabsRow, type ProfileTabId } from '@/components/creator/ProfileTabsRow';

interface Creator {
  id: string;
  username: string;
  name: string;
  profileImageUrl: string | null;
  bannerUrl?: string | null;
  aboutText?: string | null;
}

export default function CreatorProfileClient() {
  const params = useParams();
  const username = typeof params.username === 'string' ? params.username : '';
  const [creator, setCreator] = useState<Creator | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTabId>('home');
  const [subscribersCount] = useState(() => Math.floor(Math.random() * 10000));

  useEffect(() => {
    async function loadCreatorData() {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const creatorRes = await fetch(`/api/creators/${encodeURIComponent(username)}`);
        if (!creatorRes.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const { creator: c } = await creatorRes.json();
        setCreator(c);

        if (c?.id) {
          const videosRes = await fetch(`/api/videos?userId=${encodeURIComponent(c.id)}`);
          if (videosRes.ok) {
            const { videos: v } = await videosRes.json();
            setVideos(v || []);
          }
        }
      } catch (error) {
        console.error('Error loading creator data:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadCreatorData();
  }, [username]);

  if (loading) {
    return (
      <div className="w-full min-w-0 max-w-[1600px] mx-auto px-5 py-8">
        <div className="text-center text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (notFound || !creator) {
    return (
      <div className="w-full min-w-0 max-w-[1600px] mx-auto px-5 py-16 text-center">
        <h1 className="text-2xl font-semibold text-text-primary mb-2">Creator not found</h1>
        <p className="text-text-secondary mb-6">This creator doesn&apos;t exist or hasn&apos;t set up their profile yet.</p>
        <Link
          href="/"
          className="inline-block rounded-full px-6 py-2 bg-accent text-white hover:bg-accent/90 transition-colors"
        >
          Go home
        </Link>
      </div>
    );
  }

  const description = creator.aboutText || 'Welcome to my channel. Here you will find videos and content I create. Subscribe to stay updated.';

  return (
    <div className="min-h-screen w-full min-w-0 flex-1">
      <div className="w-full max-w-[1600px] mx-auto px-5">
        <BannerSection />
        <div className="py-6">
          <CreatorInfoSection
            creatorName={creator.name}
            username={creator.username}
            subscribersCount={subscribersCount}
            videoCount={videos.length}
            description={description}
            creatorPhoto={creator.profileImageUrl}
          />
        </div>
        <ProfileTabsRow activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="pt-4 pb-8">
          {activeTab === 'videos' || activeTab === 'home' ? (
            <>
              <h2 className="text-[30px] font-bold mb-4 text-text-primary">Siz uchun!</h2>
              {videos.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <p>This creator hasn&apos;t uploaded any videos yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {videos.map((video) => (
                    <Link
                      key={video.id}
                      href={`/watch/${video.id}`}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-video bg-surface rounded-xl overflow-hidden mb-2 border border-[#1A1A1A]">
                        {video.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="h-12 w-12 text-text-secondary" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-[15px] text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                        {creator.name} • {video.views.toLocaleString()} views
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
