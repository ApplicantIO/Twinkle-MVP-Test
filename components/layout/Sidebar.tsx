'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Users, Settings, Video, History, Bookmark, Radio, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';

// Check if watch history is paused
const isWatchHistoryPaused = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('watchHistoryPaused') === 'true';
};

interface SubscribedCreator {
  id: string;
  username?: string;
  name?: string;
  profileImageUrl?: string;
  isLive: boolean;
  liveViewers?: number;
  latestActivity: Date | null;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isCollapsed, setIsCollapsed, isBackdropActive } = useSidebar();
  const [isHistoryPaused, setIsHistoryPaused] = useState(false);
  const [subscribedCreators, setSubscribedCreators] = useState<SubscribedCreator[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(false);

  // Sample creators data for demonstration
  const sampleCreators: SubscribedCreator[] = [
    {
      id: 'sample-creator-1',
      username: 'ozimiz',
      name: "O'zimiz",
      profileImageUrl: 'https://ui-avatars.com/api/?name=Ozimiz&background=6366f1&color=fff&size=128',
      isLive: true,
      liveViewers: 3500,
      latestActivity: new Date(),
    },
    {
      id: 'sample-creator-2',
      username: 'romalive',
      name: 'Roma Live',
      profileImageUrl: 'https://ui-avatars.com/api/?name=Roma+Live&background=ef4444&color=fff&size=128',
      isLive: true,
      liveViewers: 2100,
      latestActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      id: 'sample-creator-3',
      username: 'gta6daily',
      name: 'GTA 6 Daily',
      profileImageUrl: 'https://ui-avatars.com/api/?name=GTA6&background=10b981&color=fff&size=128',
      isLive: false,
      liveViewers: 0,
      latestActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 'sample-creator-4',
      username: 'twinkle',
      name: 'Twinkle Official',
      profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle&background=8b5cf6&color=fff&size=128',
      isLive: false,
      liveViewers: 0,
      latestActivity: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      id: 'sample-creator-5',
      username: 'creativestudio',
      name: 'Creative Studio',
      profileImageUrl: 'https://ui-avatars.com/api/?name=Creative&background=f59e0b&color=fff&size=128',
      isLive: false,
      liveViewers: 0,
      latestActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: 'sample-creator-6',
      username: 'lofigirl',
      name: 'Lo-Fi Girl',
      profileImageUrl: 'https://ui-avatars.com/api/?name=LoFi+Girl&background=8b5cf6&color=fff&size=128',
      isLive: false,
      liveViewers: 0,
      latestActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: 'sample-creator-7',
      username: 'konsta',
      name: 'Konsta',
      profileImageUrl: 'https://ui-avatars.com/api/?name=Konsta&background=ef4444&color=fff&size=128',
      isLive: false,
      liveViewers: 0,
      latestActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  ];

  // Group 1: Feed
  const feedItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Users, label: 'Fan Zone', href: '/fanzone' },
  ];

  // Group 2: Your activity
  const activityItems = [
    { icon: Video, label: 'Subscriptions', href: '/subscriptions' },
    { icon: History, label: 'History', href: '/history', showPausedIndicator: true },
    { icon: Bookmark, label: 'Saved', href: '/saved' },
  ];

  const creatorItems = user?.role === 'creator' || user?.role === 'admin' ? [
    { icon: Settings, label: 'Creator Studio', href: '/studio' },
  ] : [];

  // Sort creators with LIVE priority (same logic as API)
  const sortCreators = (creators: SubscribedCreator[]): SubscribedCreator[] => {
    return [...creators].sort((a, b) => {
      // Priority 1: LIVE videos/broadcasts ALWAYS on top
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      
      // If both are live, sort by viewers
      if (a.isLive && b.isLive) {
        return (b.liveViewers || 0) - (a.liveViewers || 0);
      }
      
      // Priority 2: LIFO - Sort by latest activity timestamp (newest first)
      const aTime = a.latestActivity?.getTime() || 0;
      const bTime = b.latestActivity?.getTime() || 0;
      
      if (aTime === 0 && bTime === 0) return 0;
      if (aTime === 0) return 1;
      if (bTime === 0) return -1;
      
      return bTime - aTime;
    });
  };

  useEffect(() => {
    async function fetchSubscribedCreators() {
      // Always show sample data for demonstration
      // In production, this would only show when user is logged in and API returns data
      const sortedSampleCreators = sortCreators(sampleCreators);
      
      if (!user) {
        // Show sample data even when not logged in for demo purposes
        setSubscribedCreators(sortedSampleCreators);
        setLoadingCreators(false);
        return;
      }

      setLoadingCreators(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setSubscribedCreators(sortedSampleCreators);
          setLoadingCreators(false);
          return;
        }

        const response = await fetch('/api/subscriptions/creators', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const apiCreators = data.creators || [];
          // If no creators from API, use sample data
          const creatorsToUse = apiCreators.length > 0 ? apiCreators : sampleCreators;
          setSubscribedCreators(sortCreators(creatorsToUse));
        } else {
          // Fallback to sample data if API fails
          setSubscribedCreators(sortedSampleCreators);
        }
      } catch (error) {
        console.error('Error fetching subscribed creators:', error);
        // Fallback to sample data on error
        setSubscribedCreators(sortedSampleCreators);
      } finally {
        setLoadingCreators(false);
      }
    }

    fetchSubscribedCreators();
  }, [user]);

  // Check history pause state and listen for changes
  useEffect(() => {
    setIsHistoryPaused(isWatchHistoryPaused());

    const handleHistoryPauseChange = () => {
      setIsHistoryPaused(isWatchHistoryPaused());
    };

    // Listen for pause state changes
    window.addEventListener('watchHistoryUpdated', handleHistoryPauseChange);
    // Also check on storage events (in case changed in another tab)
    window.addEventListener('storage', handleHistoryPauseChange);

    return () => {
      window.removeEventListener('watchHistoryUpdated', handleHistoryPauseChange);
      window.removeEventListener('storage', handleHistoryPauseChange);
    };
  }, []);

  // Render menu item helper
  const renderMenuItem = (item: { icon: React.ElementType<{ className?: string; strokeWidth?: number }>; label: string; href: string; disabled?: boolean; showPausedIndicator?: boolean }) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.disabled ? '#' : item.href}
              className={cn(
          "flex items-center rounded-lg transition-colors relative",
                isActive ? "bg-white/5" : "hover:bg-white/5",
          "text-white",
          item.disabled && "opacity-50 cursor-not-allowed",
          isCollapsed ? "justify-center px-4 py-2" : "gap-3 px-4 py-2"
              )}
              onClick={(e) => item.disabled && e.preventDefault()}
        title={isCollapsed ? item.label : undefined}
            >
        {typeof Icon === 'function' ? (
          <Icon className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-5 w-5")} strokeWidth={1.5} />
        ) : (
          <Icon className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-5 w-5")} strokeWidth={1.5} />
        )}
        {!isCollapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={cn("font-medium text-sm text-white", isActive && "font-semibold")}>{item.label}</span>
            {item.showPausedIndicator && isHistoryPaused && (
              <span className="text-xs font-light text-zinc-500">(paused)</span>
            )}
          </div>
        )}
            </Link>
          );
  };

  // NOTE: Sidebar must remain route-agnostic per ARCHITECTURE_RULES.md 8.1-8.3
  // Z-index is constant at z-50 (L3) per section 5.1
  // Watch page backdrop handling is managed by the page itself, not the sidebar
  return (
    <>
      {/* Hide sidebar on mobile/tablet (below lg breakpoint) - Desktop only */}
      <aside 
        className={cn(
          "hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r border-surface overflow-y-auto transition-all duration-300 pointer-events-auto",
          "sidebar-scrollbar-hide", // Custom class for hiding scrollbar
          isCollapsed ? "w-16 z-[400]" : isBackdropActive ? "w-52 z-[800]" : "w-52 z-[400]"
        )}
      >
      <nav className="px-2 py-2 space-y-1">
        {/* Group 1: Feed */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <h4 className="px-4 py-2 text-xs font-semibold text-white/70 tracking-wider">
              Feed
            </h4>
          )}
          {feedItems.map(renderMenuItem)}
        </div>

        {/* Horizontal Rule after Feed */}
        <hr className="border-surface my-2" />

        {/* Group 2: Your activity */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <h4 className="px-4 py-2 text-xs font-semibold text-white/70 tracking-wider">
              Your activity
            </h4>
          )}
          {activityItems.map(renderMenuItem)}
        </div>

        {/* Horizontal Rule after Your activity */}
        <hr className="border-surface my-2" />

        {/* Group 3: Subscriptions (Creators & Live broadcasts) */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <h4 className="px-4 py-2 text-xs font-semibold text-white/70 tracking-wider">
              Subscriptions
            </h4>
          )}
          {loadingCreators ? (
            <div className={cn(
              "text-xs text-white",
              isCollapsed ? "px-3 py-2 text-center" : "px-4 py-2"
            )}>
              {isCollapsed ? "..." : "Loading..."}
            </div>
          ) : subscribedCreators.length > 0 ? (
            subscribedCreators.map((creator) => (
              <Link
                key={creator.id}
                href={`/${creator.username ?? creator.id}`}
                className={cn(
                  "flex items-center w-full rounded-lg transition-colors group relative text-white",
                  pathname === `/${creator.username ?? creator.id}` ? "bg-white/5" : "hover:bg-white/5",
                  isCollapsed ? "justify-center px-4 py-2" : "gap-2 px-4 py-2"
                )}
                title={isCollapsed ? creator.name || 'Creator' : undefined}
              >
                <div className="relative flex-shrink-0">
                  {creator.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.profileImageUrl}
                      alt={creator.name || 'Creator'}
                      className={cn("rounded-full object-cover", isCollapsed ? "w-6 h-6" : "w-6 h-6")}
                    />
                  ) : (
                    <div className={cn("rounded-full bg-surface flex items-center justify-center", isCollapsed ? "w-6 h-6" : "w-6 h-6")}>
                      <Users className={cn("text-white", isCollapsed ? "h-3 w-3" : "h-3 w-3")} strokeWidth={1.5} />
                    </div>
                  )}
                  {creator.isLive && (
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm text-white truncate block overflow-hidden text-ellipsis whitespace-nowrap">
                        {creator.name || 'Creator'}
                      </span>
                    </div>
                    {creator.isLive && (
                      <div className="flex items-center gap-1 text-red-500 ml-auto flex-shrink-0">
                        <Radio className="h-3 w-3" strokeWidth={1.5} />
                        <span className="text-xs font-semibold">LIVE</span>
                      </div>
                    )}
                  </>
                )}
              </Link>
            ))
          ) : (
            <div className={cn(
              "text-xs text-white",
              isCollapsed ? "px-3 py-2 text-center" : "px-4 py-2"
            )}>
              {isCollapsed ? "..." : "No subscriptions yet"}
            </div>
          )}
        </div>

        {/* Horizontal Rule after Subscriptions */}
        <hr className="border-surface my-2" />
        
        {/* Creator Studio (if applicable) */}
        {creatorItems.length > 0 && (
          <div className="space-y-1">
            {creatorItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg transition-colors relative text-white",
                    isActive ? "bg-white/5" : "hover:bg-white/5",
                    isCollapsed ? "justify-center px-4 py-2" : "gap-3 px-4 py-2"
                  )}
                    title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-5 w-5")} strokeWidth={1.5} />
                  {!isCollapsed && (
                    <span className={cn("font-medium text-sm text-white", isActive && "font-semibold")}>{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
    </>
  );
}
