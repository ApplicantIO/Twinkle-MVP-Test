'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Headphones, Users, Settings, Video, History, Bookmark, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';

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
  const { isCollapsed } = useSidebar();
  const [subscribedCreators, setSubscribedCreators] = useState<SubscribedCreator[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(false);

  // Sample creators data for demonstration
  const sampleCreators: SubscribedCreator[] = [
    {
      id: 'sample-creator-1',
      name: "O'zimiz",
      profileImageUrl: 'https://ui-avatars.com/api/?name=Ozimiz&background=6366f1&color=fff&size=128',
      isLive: true,
      liveViewers: 3500,
      latestActivity: new Date(),
    },
    {
      id: 'sample-creator-2',
      name: 'Roma Live',
      profileImageUrl: 'https://ui-avatars.com/api/?name=Roma+Live&background=ef4444&color=fff&size=128',
      isLive: true,
      liveViewers: 2100,
      latestActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      id: 'sample-creator-3',
      name: 'GTA 6 Daily',
      profileImageUrl: 'https://ui-avatars.com/api/?name=GTA6&background=10b981&color=fff&size=128',
      isLive: false,
      liveViewers: 0,
      latestActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 'sample-creator-4',
      name: 'Twinkle Official',
      profileImageUrl: 'https://ui-avatars.com/api/?name=Twinkle&background=8b5cf6&color=fff&size=128',
      isLive: false,
      liveViewers: 0,
      latestActivity: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      id: 'sample-creator-5',
      name: 'Creative Studio',
      profileImageUrl: 'https://ui-avatars.com/api/?name=Creative&background=f59e0b&color=fff&size=128',
      isLive: false,
      liveViewers: 0,
      latestActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: 'sample-creator-6',
      name: 'Lo-Fi Girl',
      profileImageUrl: 'https://ui-avatars.com/api/?name=LoFi+Girl&background=8b5cf6&color=fff&size=128',
      isLive: false,
      liveViewers: 0,
      latestActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      id: 'sample-creator-7',
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
    { icon: Sparkles, label: 'Daily', href: '/daily' },
    { icon: Headphones, label: 'Podcast', href: '/podcast' },
    { icon: Users, label: 'Fan Zone', href: '/fan-zone' },
  ];

  // Group 2: Your activity
  const activityItems = [
    { icon: Video, label: 'Subscriptions', href: '/subscriptions' },
    { icon: History, label: 'History', href: '/history' },
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

  // Render menu item helper
  const renderMenuItem = (item: { icon: any; label: string; href: string; disabled?: boolean }) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.disabled ? '#' : item.href}
              className={cn(
          "flex items-center rounded-lg transition-colors",
                isActive
            ? "bg-surface text-white"
            : "text-white hover:bg-surface hover:text-white",
          item.disabled && "opacity-50 cursor-not-allowed",
          isCollapsed ? "justify-center px-3 py-2" : "gap-4 px-4 py-2"
              )}
              onClick={(e) => item.disabled && e.preventDefault()}
        title={isCollapsed ? item.label : undefined}
            >
        <Icon className="h-6 w-6 flex-shrink-0" />
        {!isCollapsed && (
          <span className="font-medium text-sm text-white">{item.label}</span>
        )}
            </Link>
          );
  };

  // Check if we're on watch page for overlay mode
  const isWatchPage = pathname?.startsWith('/watch');

  return (
    <>
      {/* Backdrop overlay when sidebar is expanded on watch page (desktop only) */}
      {isWatchPage && !isCollapsed && (
        <div
          className="hidden lg:block fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => {
            // Optional: Close sidebar when clicking backdrop
            // setIsCollapsed(true);
          }}
        />
      )}
      {/* Hide sidebar on mobile/tablet (below lg breakpoint) - Desktop only */}
      <aside 
        className={cn(
          "hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r border-surface pt-4 overflow-y-auto transition-all duration-300",
          "sidebar-scrollbar-hide", // Custom class for hiding scrollbar
          isCollapsed ? "w-16 z-40" : isWatchPage ? "w-52 z-50" : "w-52 z-40"
        )}
      >
      <nav className="px-2 space-y-4">
        {/* Group 1: Feed */}
        <div className="space-y-1">
          {!isCollapsed && (
            <h4 className="px-4 py-2 text-xs font-semibold text-white uppercase tracking-wider">
              Feed
            </h4>
          )}
          {feedItems.map(renderMenuItem)}
        </div>

        {/* Horizontal Rule after Feed */}
        <hr className="border-surface my-2" />

        {/* Group 2: Your activity */}
        <div className="space-y-1">
          {!isCollapsed && (
            <h4 className="px-4 py-2 text-xs font-semibold text-white uppercase tracking-wider">
              Your activity
            </h4>
          )}
          {activityItems.map(renderMenuItem)}
        </div>

        {/* Horizontal Rule after Your activity */}
        <hr className="border-surface my-2" />

        {/* Group 3: Subscriptions (Creators & Live broadcasts) */}
        <div className="space-y-1">
          {!isCollapsed && (
            <h4 className="px-4 py-2 text-xs font-semibold text-white uppercase tracking-wider">
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
                href={`/creator/${creator.id}`}
                className={cn(
                  "flex items-center w-full rounded-lg transition-colors group",
                  pathname === `/creator/${creator.id}`
                    ? "bg-surface text-white"
                    : "text-white hover:bg-surface hover:text-white",
                  isCollapsed ? "justify-center px-3 py-1" : "gap-2 px-3 py-1"
                )}
                title={isCollapsed ? creator.name || 'Creator' : undefined}
              >
                <div className="relative flex-shrink-0">
                  {creator.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.profileImageUrl}
                      alt={creator.name || 'Creator'}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center">
                      <Users className="h-3.5 w-3.5 text-white" />
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
                        <Radio className="h-3 w-3" />
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
                    "flex items-center rounded-lg transition-colors",
                    isActive
                      ? "bg-surface text-accent"
                      : "text-white hover:bg-surface hover:text-white",
                    isCollapsed ? "justify-center px-3 py-2" : "gap-4 px-4 py-2"
                  )}
                    title={isCollapsed ? item.label : undefined}
                >
                    <Icon className="h-6 w-6 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium text-sm text-white">{item.label}</span>
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
