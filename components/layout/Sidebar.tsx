'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Headphones, Users, Settings, Video, History, Bookmark, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SubscribedCreator {
  id: string;
  name?: string;
  profileImageUrl?: string;
  isLive: boolean;
  liveViewers?: number;
  latestActivity: Date | null;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [subscribedCreators, setSubscribedCreators] = useState<SubscribedCreator[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Sparkles, label: 'Daily', href: '/daily' },
    { icon: Headphones, label: 'Podcast', href: '/podcast' },
    { icon: Users, label: 'Fan Zone', href: '/fan-zone' },
    { icon: Video, label: 'Subscriptions', href: '/subscriptions' },
    { icon: History, label: 'History', href: '/history' },
    { icon: Bookmark, label: 'Saved', href: '/saved' },
  ];

  const creatorItems = user?.role === 'creator' || user?.role === 'admin' ? [
    { icon: Settings, label: 'Creator Studio', href: '/studio' },
  ] : [];

  useEffect(() => {
    async function fetchSubscribedCreators() {
      if (!user) {
        setSubscribedCreators([]);
        return;
      }

      setLoadingCreators(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setSubscribedCreators([]);
          return;
        }

        const response = await fetch('/api/subscriptions/creators', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSubscribedCreators(data.creators || []);
        }
      } catch (error) {
        console.error('Error fetching subscribed creators:', error);
      } finally {
        setLoadingCreators(false);
      }
    }

    fetchSubscribedCreators();
  }, [user]);

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 bg-background border-r border-surface pt-4 overflow-y-auto z-40">
      <nav className="px-2 space-y-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <div key={item.href}>
            <Link
              href={item.disabled ? '#' : item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-surface text-text-primary"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
              {/* Add divider after Fan Zone (index 3) and after Saved (index 6) */}
              {(index === 3 || index === 6) && (
                <div className="border-t border-surface my-2 mx-2" />
              )}
            </div>
          );
        })}

        {/* Subscribed Creators Section */}
        {user && (
          <>
            <div className="border-t border-surface my-2 mx-2" />
            <div className="px-2">
              {loadingCreators ? (
                <div className="px-4 py-2 text-xs text-text-secondary">Loading...</div>
              ) : subscribedCreators.length > 0 ? (
                subscribedCreators.map((creator) => (
                  <Link
                    key={creator.id}
                    href={`/creator/${creator.id}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors group",
                      pathname === `/creator/${creator.id}`
                        ? "bg-surface text-text-primary"
                        : "text-text-secondary hover:bg-surface hover:text-text-primary"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      {creator.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={creator.profileImageUrl}
                          alt={creator.name || 'Creator'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                          <Users className="h-4 w-4 text-text-secondary" />
                        </div>
                      )}
                      {creator.isLive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {creator.name || 'Creator'}
                        </span>
                        {creator.isLive && (
                          <div className="flex items-center gap-1 text-red-500">
                            <Radio className="h-3 w-3" />
                            <span className="text-xs font-semibold">LIVE</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-2 text-xs text-text-secondary">
                  No subscriptions yet
                </div>
              )}
            </div>
          </>
        )}
        
        {creatorItems.length > 0 && (
          <div className="pt-4 border-t border-surface mt-4">
            {creatorItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-surface text-accent"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}
