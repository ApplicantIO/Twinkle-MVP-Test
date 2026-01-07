'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Upload, User, LogOut, Settings, Globe, Palette, Monitor, Sun, Moon, MessageSquare, HelpCircle, ArrowLeft, Menu, CreditCard, ArrowRight, Wallet, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, Playlist } from '@/types';
import { getAllPlaylists } from '@/data/mockData';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import AuthModal from '@/components/AuthModal';
import { MobileMenu } from './MobileMenu';
import { cn } from '@/lib/utils';

// Mock user object for simulated logged-in state
const MOCK_USER = {
  email: 'yupbekha@gmail.com',
  firstName: 'Behruz',
  lastName: 'Sayfiddinov',
  username: 'yupbekha',
  avatar: null, // Will use user initial as placeholder
};

export function Header() {
  const { user, logout } = useAuth();
  const { setIsCollapsed, isCollapsed } = useSidebar();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [language, setLanguage] = useState('en');
  const [appearance, setAppearance] = useState('system');
  const [settingsView, setSettingsView] = useState<'main' | 'language' | 'appearance' | 'switchAccount'>('main');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Search UI states
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const SEARCH_HISTORY_KEY = 'twinkle_search_history';
  
  // Use actual user role if available, otherwise default to viewer
  const userRole = (user?.role as 'viewer' | 'creator' | 'admin') || 'viewer';
  
  // Mock secondary account
  const mockSecondaryAccount = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    addToHistory(query);
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setIsSearchExpanded(false);
    setShowSearchDropdown(false);
    setActiveIndex(-1);
  };

  // History helpers
  const loadHistory = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveHistory = (items: string[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items.slice(0, 10)));
    } catch {
      // ignore
    }
  };

  const addToHistory = (q: string) => {
    const existing = loadHistory().filter(item => item.toLowerCase() !== q.toLowerCase());
    const updated = [q, ...existing];
    saveHistory(updated);
    setSearchHistory(updated);
  };

  const deleteHistoryItem = (q: string) => {
    const updated = searchHistory.filter(item => item !== q);
    saveHistory(updated);
    setSearchHistory(updated);
  };

  useEffect(() => {
    setSearchHistory(loadHistory());
  }, []);

  type SearchDropdownItem = {
    key: string;
    type: 'recent' | 'explore' | 'video' | 'playlist' | 'channel' | 'category';
    primary: string;
    suffix?: string;
    value: string;
  };

  const EXPLORE_ITEMS: Array<{ label: string; query: string }> = [
    { label: 'Top Music', query: 'Music' },
    { label: 'Podcasts', query: 'Podcasts' },
    { label: 'Live Streams', query: 'Live' },
    { label: 'Tech', query: 'Tech' },
  ];

  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [liveResults, setLiveResults] = useState<{
    videos: SearchDropdownItem[];
    playlists: SearchDropdownItem[];
    channels: SearchDropdownItem[];
    categories: SearchDropdownItem[];
  }>({ videos: [], playlists: [], channels: [], categories: [] });

  useEffect(() => {
    // Load playlists from local mock data
    try {
      setAllPlaylists(getAllPlaylists() as any);
    } catch {
      setAllPlaylists([]);
    }

    // Load videos from API
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/videos');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setAllVideos((data?.videos || []) as Video[]);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce typing for performance
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fuzzyScore = (text: string, q: string): number => {
    const hay = text.toLowerCase();
    const needle = q.toLowerCase();
    if (!needle) return 0;
    const idx = hay.indexOf(needle);
    if (idx >= 0) {
      // Prefer earlier matches and longer needle
      return 1000 - idx + needle.length * 10;
    }

    // Simple subsequence match
    let h = 0;
    let matched = 0;
    for (let n = 0; n < needle.length; n++) {
      const c = needle[n];
      while (h < hay.length && hay[h] !== c) h++;
      if (h === hay.length) return 0;
      matched++;
      h++;
    }
    return 400 + matched * 5;
  };

  const renderHighlighted = (text: string, q: string) => {
    if (!q) return text;
    const hay = text.toLowerCase();
    const needle = q.toLowerCase();
    const idx = hay.indexOf(needle);
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold">{text.slice(idx, idx + q.length)}</span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const selectDropdownItem = (item: SearchDropdownItem) => {
    setSearchQuery(item.value);
    addToHistory(item.value);
    router.push(`/search?q=${encodeURIComponent(item.value)}`);
    setShowSearchDropdown(false);
    setIsSearchExpanded(false);
    setActiveIndex(-1);
  };

  // Build live results from real content
  useEffect(() => {
    const q = debouncedQuery;
    if (!q) {
      setLiveResults({ videos: [], playlists: [], channels: [], categories: [] });
      return;
    }

    const scoredVideos = allVideos
      .map((v) => ({
        v,
        score:
          fuzzyScore(v.title || '', q) +
          fuzzyScore(v.user?.name || '', q) +
          fuzzyScore(v.category || '', q),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ v }) => ({
        key: `video-${v.id}`,
        type: 'video' as const,
        primary: v.title || 'Untitled',
        suffix: 'Video',
        value: v.title || '',
      }));

    const scoredPlaylists = allPlaylists
      .map((p: any) => ({
        p,
        score:
          fuzzyScore(p.title || '', q) +
          fuzzyScore(p.creatorName || '', q) +
          fuzzyScore(p.type || '', q),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ p }: any) => ({
        key: `playlist-${p.id}`,
        type: 'playlist' as const,
        primary: p.title || 'Untitled',
        suffix: 'Playlist',
        value: p.title || '',
      }));

    // Channels derived from video users
    const channelMap = new Map<string, { id: string; name: string }>();
    allVideos.forEach((v) => {
      if (!v.user?.name) return;
      const id = (v.user as any).id || v.userId || v.user?.name;
      if (!channelMap.has(id)) channelMap.set(id, { id, name: v.user.name });
    });

    const scoredChannels = Array.from(channelMap.values())
      .map((c) => ({ c, score: fuzzyScore(c.name, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ c }) => ({
        key: `channel-${c.id}`,
        type: 'channel' as const,
        primary: c.name,
        suffix: 'Channel',
        value: c.name,
      }));

    // Categories from videos
    const categories = Array.from(
      new Set(allVideos.map((v) => v.category).filter(Boolean) as string[])
    );
    const scoredCategories = categories
      .map((cat) => ({ cat, score: fuzzyScore(cat, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ cat }) => ({
        key: `category-${cat}`,
        type: 'category' as const,
        primary: cat,
        suffix: 'Category',
        value: cat,
      }));

    setLiveResults({
      videos: scoredVideos,
      playlists: scoredPlaylists,
      channels: scoredChannels,
      categories: scoredCategories,
    });
  }, [debouncedQuery, allVideos, allPlaylists]);

  const recentItems: SearchDropdownItem[] = useMemo(
    () =>
      searchHistory.map((h, i) => ({
        key: `recent-${h}-${i}`,
        type: 'recent' as const,
        primary: h,
        value: h,
      })),
    [searchHistory]
  );

  const exploreItems: SearchDropdownItem[] = useMemo(
    () =>
      EXPLORE_ITEMS.map((x) => ({
        key: `explore-${x.query}`,
        type: 'explore' as const,
        primary: x.label,
        value: x.query,
      })),
    []
  );

  const visibleItems: SearchDropdownItem[] = useMemo(() => {
    if (debouncedQuery.length === 0) return [...recentItems, ...exploreItems];
    return [
      ...liveResults.videos,
      ...liveResults.playlists,
      ...liveResults.channels,
      ...liveResults.categories,
    ];
  }, [debouncedQuery, exploreItems, recentItems, liveResults]);

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Close the dropdown menu
    setIsSettingsOpen(false);
    // Call the actual logout function
    logout();
    router.push('/');
  };

  const handleSwitchAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Switch to account switch view instead of closing
    setSettingsView('switchAccount');
  };


  const handleAccountSelect = (accountEmail: string) => {
    // Mock account switch - just reset to main view
    setSettingsView('main');
    console.log('Switched to account:', accountEmail);
  };

  const handleAddAccount = () => {
    // Mock add account - reset to main view
    setSettingsView('main');
    console.log('Add account clicked');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-surface z-50 flex items-center px-4">
      {/* Desktop: Menu Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex items-center justify-center p-0 h-10 w-10 mr-3 text-text-secondary hover:text-text-primary hover:bg-surface"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo - Always visible */}
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xl lg:text-2xl font-bold text-accent">Twinkle</span>
      </Link>

      {/* Centered search bar with fixed px width and expansion on focus */}
      <form
        onSubmit={(e) => {
          handleSearch(e);
        }}
        className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
        style={{
          width: isSearchExpanded ? '600px' : '420px',
          minWidth: '200px',
        }}
      >
        <div className="relative">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              setIsSearchExpanded(true);
              setShowSearchDropdown(true);
              setSearchHistory(loadHistory());
              setActiveIndex(-1);
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowSearchDropdown(false);
                setIsSearchExpanded(false);
                setActiveIndex(-1);
              }, 150);
            }}
            onKeyDown={(e) => {
              if (!showSearchDropdown) return;
              const count = visibleItems.length;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (count === 0) return;
                setActiveIndex((prev) => (prev + 1) % count);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (count === 0) return;
                setActiveIndex((prev) => (prev - 1 + count) % count);
              } else if (e.key === 'Enter') {
                if (activeIndex >= 0 && activeIndex < count) {
                  e.preventDefault();
                  selectDropdownItem(visibleItems[activeIndex]);
                }
              } else if (e.key === 'Escape') {
                setShowSearchDropdown(false);
                setIsSearchExpanded(false);
                setActiveIndex(-1);
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="pl-4 pr-12 bg-surface border border-gray-700 text-text-primary placeholder:text-text-secondary rounded-full h-10 focus:border-gray-600 w-full"
            aria-autocomplete="list"
            aria-expanded={showSearchDropdown}
            aria-controls="search-suggestions"
            role="combobox"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent/90 text-white rounded-full p-2 h-8 w-8 flex items-center justify-center"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Dropdown: RECENT + EXPLORE (empty) or RESULTS (typing) */}
          {showSearchDropdown && (
            <div className="absolute left-0 top-full mt-2 w-full z-[60]">
              <div className="bg-surface border border-gray-700 rounded-lg overflow-hidden">
                <div id="search-suggestions" role="listbox" className="max-h-80 overflow-auto">
                  {debouncedQuery.length === 0 ? (
                    (() => {
                      const recentBase = 0;
                      const exploreBase = recentItems.length;

                      return (
                        <>
                          <div className="px-3 pt-3 pb-1 text-[11px] font-semibold tracking-widest text-text-secondary/80">
                            RECENT
                          </div>

                          {recentItems.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-text-secondary">No recent searches</div>
                          ) : (
                            <div className="pb-2">
                              {recentItems.map((item, idx) => {
                                const flatIndex = recentBase + idx;
                                return (
                                  <div
                                    key={item.key}
                                    role="option"
                                    aria-selected={activeIndex === flatIndex}
                                    className={cn(
                                      "flex items-center justify-between px-3 py-2 cursor-pointer",
                                      activeIndex === flatIndex ? "bg-white/10" : "hover:bg-white/5"
                                    )}
                                    onMouseEnter={() => setActiveIndex(flatIndex)}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => selectDropdownItem(item)}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <Clock className="h-4 w-4 text-text-secondary flex-shrink-0" />
                                      <span className="text-sm text-text-primary truncate">{item.primary}</span>
                                    </div>
                                    <button
                                      type="button"
                                      className="text-text-secondary hover:text-text-primary p-1"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteHistoryItem(item.value);
                                        setActiveIndex(-1);
                                      }}
                                      aria-label={`Remove ${item.primary} from history`}
                                      title="Remove"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-widest text-text-secondary/80">
                            EXPLORE
                          </div>
                          <div className="pb-2">
                            {exploreItems.map((item, idx) => {
                              const flatIndex = exploreBase + idx;
                              return (
                                <div
                                  key={item.key}
                                  role="option"
                                  aria-selected={activeIndex === flatIndex}
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2 cursor-pointer",
                                    activeIndex === flatIndex ? "bg-white/10" : "hover:bg-white/5"
                                  )}
                                  onMouseEnter={() => setActiveIndex(flatIndex)}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => selectDropdownItem(item)}
                                >
                                  <Globe className="h-4 w-4 text-text-secondary flex-shrink-0" />
                                  <span className="text-sm text-text-primary truncate">{item.primary}</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    (() => {
                      const videoBase = 0;
                      const playlistBase = liveResults.videos.length;
                      const channelBase = playlistBase + liveResults.playlists.length;
                      const categoryBase = channelBase + liveResults.channels.length;
                      const any =
                        liveResults.videos.length +
                          liveResults.playlists.length +
                          liveResults.channels.length +
                          liveResults.categories.length >
                        0;

                      if (!any) {
                        return (
                          <div className="px-4 py-3 text-sm text-text-secondary">No matches</div>
                        );
                      }

                      const renderResultRow = (item: any, flatIndex: number) => (
                        <div
                          key={item.key}
                          role="option"
                          aria-selected={activeIndex === flatIndex}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 cursor-pointer",
                            activeIndex === flatIndex ? "bg-white/10" : "hover:bg-white/5"
                          )}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectDropdownItem(item)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Search className="h-4 w-4 text-text-secondary flex-shrink-0" />
                            <span className="text-sm text-text-primary truncate">
                              {renderHighlighted(item.primary, debouncedQuery)}
                            </span>
                          </div>
                          {item.suffix ? (
                            <span className="text-xs text-text-secondary flex-shrink-0 ml-3">
                              {item.suffix}
                            </span>
                          ) : null}
                        </div>
                      );

                      return (
                        <>
                          {liveResults.videos.length > 0 && (
                            <>
                              <div className="px-3 pt-3 pb-1 text-[11px] font-semibold tracking-widest text-text-secondary/80">
                                VIDEOS
                              </div>
                              <div className="pb-2">
                                {liveResults.videos.map((item, idx) =>
                                  renderResultRow(item, videoBase + idx)
                                )}
                              </div>
                            </>
                          )}

                          {liveResults.playlists.length > 0 && (
                            <>
                              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-widest text-text-secondary/80">
                                PLAYLISTS
                              </div>
                              <div className="pb-2">
                                {liveResults.playlists.map((item, idx) =>
                                  renderResultRow(item, playlistBase + idx)
                                )}
                              </div>
                            </>
                          )}

                          {liveResults.channels.length > 0 && (
                            <>
                              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-widest text-text-secondary/80">
                                CHANNELS
                              </div>
                              <div className="pb-2">
                                {liveResults.channels.map((item, idx) =>
                                  renderResultRow(item, channelBase + idx)
                                )}
                              </div>
                            </>
                          )}

                          {liveResults.categories.length > 0 && (
                            <>
                              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-widest text-text-secondary/80">
                                CATEGORIES
                              </div>
                              <div className="pb-2">
                                {liveResults.categories.map((item, idx) =>
                                  renderResultRow(item, categoryBase + idx)
                                )}
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Mobile: Search removed - only logo and menu icon visible */}
      {/* Search functionality moved to mobile menu */}

      {/* Mobile Menu Button (only on mobile/tablet) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden ml-auto text-text-secondary hover:text-text-primary hover:bg-surface"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Right side actions - Desktop only, Fixed width container to prevent overlap */}
      <div className="hidden lg:flex ml-auto items-center gap-2 flex-shrink-0 min-w-0">
        {user ? (
          <>
            {/* User Profile Button - Opens Settings Modal */}
            <DropdownMenu 
              open={isSettingsOpen} 
              onOpenChange={(open) => {
                if (open !== isSettingsOpen) {
                  setIsSettingsOpen(open);
                  if (!open) {
                    // Reset to main view when closing
                    setSettingsView('main');
                    // Remove focus from button when dropdown closes
                    setTimeout(() => {
                      profileButtonRef.current?.blur();
                    }, 0);
                  }
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  ref={profileButtonRef}
                  className="flex items-center gap-2.5 pl-3 pr-1 h-10 rounded-full bg-surface border border-transparent hover:border-gray-500 transition-colors focus:outline-none"
                >
                  {/* First Name */}
                  <span className="text-sm font-medium text-text-primary">
                    {MOCK_USER.firstName}
                  </span>
                  {/* Avatar */}
                  {MOCK_USER.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={MOCK_USER.avatar}
                      alt={MOCK_USER.firstName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white font-medium text-sm">
                      {MOCK_USER.firstName.charAt(0)}
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface border-surface w-56">
            {settingsView === 'main' && (
              <>
                {/* Group 1: Account Actions */}
                <DropdownMenuItem
                  onClick={() => router.push('/profile')}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSwitchAccount(e as any);
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
                >
                  <div className="flex gap-2">
                    <User className="h-4 w-4" />
                    <span>Switch account</span>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout(e);
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
                
                <div className="border-t border-gray-700 my-1" />

                {/* Group 2: Creator Tools */}
                <DropdownMenuItem
                  onClick={() => router.push('/become-creator')}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  Become Creator
                </DropdownMenuItem>
                
                {/* Twinkle Studio - Only show if user is creator or admin */}
                {(userRole === 'creator' || userRole === 'admin') && (
                  <DropdownMenuItem
                    onClick={() => {
                      router.push('/studio');
                    }}
                    className="text-text-primary hover:bg-background cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Twinkle Studio
                  </DropdownMenuItem>
                )}
                
                <div className="border-t border-gray-700 my-1" />

                {/* Group 3: App Settings */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSettingsView('language');
                    // Keep menu open
                    setIsSettingsOpen(true);
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
                >
                  <div className="flex gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Language</span>
                  </div>
                  <span className="text-xs text-text-secondary">{language.toUpperCase()}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSettingsView('appearance');
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
                >
                  <div className="flex gap-2">
                    <Moon className="h-4 w-4" />
                    <span>Appearance</span>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {appearance === 'system' ? <Monitor className="h-3 w-3" /> : appearance === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                  </span>
                </DropdownMenuItem>
                
                <div className="border-t border-gray-700 my-1" />

                {/* Group 4: Support */}
                <DropdownMenuItem
                  onClick={() => router.push('/feedback')}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push('/help')}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help
                </DropdownMenuItem>
              </>
            )}

            {settingsView === 'language' && (
              <>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setSettingsView('main');
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </DropdownMenuItem>
                <div className="border-t border-gray-700 my-1" />
                
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLanguage('uz');
                    setSettingsView('main');
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    language === 'uz'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  O'zbek 🇺🇿
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLanguage('en');
                    setSettingsView('main');
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    language === 'en'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  English 🇬🇧
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLanguage('ru');
                    setSettingsView('main');
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    language === 'ru'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  Russian 🇷🇺
                </DropdownMenuItem>
              </>
            )}

            {settingsView === 'appearance' && (
              <>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setSettingsView('main');
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </DropdownMenuItem>
                <div className="border-t border-gray-700 my-1" />
                
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAppearance('system');
                    setSettingsView('main');
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    appearance === 'system'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  System
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAppearance('light');
                    setSettingsView('main');
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    appearance === 'light'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAppearance('dark');
                    setSettingsView('main');
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    appearance === 'dark'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </DropdownMenuItem>
              </>
            )}

            {settingsView === 'switchAccount' && (
              <>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSettingsView('main');
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </DropdownMenuItem>
                <div className="border-t border-gray-700 my-1" />
                
                {/* Currently logged-in account */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAccountSelect(MOCK_USER.email);
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                    {MOCK_USER.firstName.charAt(0)}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary">
                      {MOCK_USER.firstName} {MOCK_USER.lastName}
                    </span>
                    <span className="text-xs text-text-secondary truncate">
                      {MOCK_USER.email}
                    </span>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                </DropdownMenuItem>
                
                {/* Secondary account */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAccountSelect(mockSecondaryAccount.email);
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                    {mockSecondaryAccount.firstName.charAt(0)}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary">
                      {mockSecondaryAccount.firstName} {mockSecondaryAccount.lastName}
                    </span>
                    <span className="text-xs text-text-secondary truncate">
                      {mockSecondaryAccount.email}
                    </span>
                  </div>
                </DropdownMenuItem>
                
                <div className="border-t border-gray-700 my-1" />
                
                {/* Add Account button */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddAccount();
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  Add Account
                </DropdownMenuItem>
              </>
            )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            {/* Sign In and Sign Up buttons when not logged in */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="text-text-secondary hover:text-text-primary"
            >
              Sign In
            </Button>
            <Button
              onClick={() => {
                setAuthModalMode('signup');
                setIsAuthModalOpen(true);
              }}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              Sign Up
            </Button>
          </div>

            {/* Settings Dropdown - only shown when not logged in */}
            <DropdownMenu 
              open={isSettingsOpen} 
              onOpenChange={(open) => {
                if (open !== isSettingsOpen) {
                  setIsSettingsOpen(open);
                  if (!open) {
                    setSettingsView('main');
                  }
                }
              }}
            >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
                  className={cn(
                    "text-text-secondary hover:text-text-primary hover:bg-surface",
                    isSettingsOpen && "bg-surface text-text-primary"
                  )}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface border-surface w-56">
            {settingsView === 'main' && (
              <>
                {/* Language */}
                <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSettingsView('language');
                      }}
                  className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
                >
                  <div className="flex gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Language</span>
                  </div>
                  <span className="text-xs text-text-secondary">{language.toUpperCase()}</span>
                </DropdownMenuItem>

                {/* Appearance */}
                <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSettingsView('appearance');
                      }}
                  className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
                >
                  <div className="flex gap-2">
                        <Moon className="h-4 w-4" />
                    <span>Appearance</span>
                  </div>
                  <span className="text-xs text-text-secondary">
                        {appearance === 'system' ? <Monitor className="h-3 w-3" /> : appearance === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                  </span>
                </DropdownMenuItem>

                {/* Divider */}
                <div className="border-t border-gray-700 my-1" />

                {/* Feedback */}
                <DropdownMenuItem
                  onClick={() => router.push('/feedback')}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                      <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback
                </DropdownMenuItem>

                {/* Help */}
                <DropdownMenuItem
                  onClick={() => router.push('/help')}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                      <HelpCircle className="h-4 w-4 mr-2" />
                  Help
                </DropdownMenuItem>
              </>
            )}

            {settingsView === 'language' && (
              <>
                <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSettingsView('main');
                      }}
                  className="text-text-primary hover:bg-background cursor-pointer mb-2"
                >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                </DropdownMenuItem>
                <div className="border-t border-gray-700 my-1" />
                
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setLanguage('uz');
                    setSettingsView('main');
                        setIsSettingsOpen(false);
                  }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        language === 'uz'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                      O'zbek 🇺🇿
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setLanguage('en');
                    setSettingsView('main');
                        setIsSettingsOpen(false);
                  }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        language === 'en'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                      English 🇬🇧
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                    setLanguage('ru');
                    setSettingsView('main');
                        setIsSettingsOpen(false);
                  }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    language === 'ru'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                      Russian 🇷🇺
                    </DropdownMenuItem>
              </>
            )}

            {settingsView === 'appearance' && (
              <>
                <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSettingsView('main');
                      }}
                  className="text-text-primary hover:bg-background cursor-pointer mb-2"
                >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                </DropdownMenuItem>
                <div className="border-t border-gray-700 my-1" />
                
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                    setAppearance('system');
                    setSettingsView('main');
                        setIsSettingsOpen(false);
                  }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    appearance === 'system'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                      <Monitor className="h-4 w-4" />
                  System
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setAppearance('light');
                    setSettingsView('main');
                        setIsSettingsOpen(false);
                  }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        appearance === 'light'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                      <Sun className="h-4 w-4" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setAppearance('dark');
                    setSettingsView('main');
                        setIsSettingsOpen(false);
                  }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        appearance === 'dark'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                      <Moon className="h-4 w-4" />
                      Dark
                    </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
          </>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authModalMode} />
      
      {/* Mobile Menu Slide-out */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
}
