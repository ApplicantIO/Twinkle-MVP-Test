'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Video } from '@/types';
import { Button } from '@/components/ui/button';
import { Play, Upload, Settings } from 'lucide-react';
import Link from 'next/link';

export default function StudioDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ totalVideos: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
      router.push('/');
      return;
    }

    async function loadStats() {
      const userId = user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/videos?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const videos = data.videos || [];
          const totalViews = videos.reduce((sum: number, v: Video) => sum + v.views, 0);
          setStats({
            totalVideos: videos.length,
            totalViews,
          });
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user, router]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Creator Studio</h1>
        <Button onClick={() => router.push('/studio/upload')} className="bg-accent hover:bg-accent/90">
          <Upload className="h-4 w-4 mr-2" />
          Upload New Video
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Total Videos</h3>
          <p className="text-3xl font-bold text-accent">{stats.totalVideos}</p>
        </div>
        <div className="bg-surface p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Total Views</h3>
          <p className="text-3xl font-bold text-accent">{stats.totalViews.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/studio/content">
          <Button variant="outline" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Manage Videos
          </Button>
        </Link>
        <Link href="/studio/settings">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Channel Settings
          </Button>
        </Link>
      </div>
    </div>
  );
}

