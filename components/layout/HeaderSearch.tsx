'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Video, Playlist } from '@/types';
import { getAllPlaylists } from '@/data/mockData';
import { cn } from '@/lib/utils';

const SEARCH_HISTORY_KEY = 'twinkle_search_history';
const MAX_HISTORY_ITEMS = 10;
const MAX_SUGGESTION_ITEMS = 10;
const MAX_EMPTY_TOTAL_ITEMS = 12;

const EXPLORE_ITEMS: Array<{ label: string; query: string }> = [
  { label: 'Top Music', query: 'Music' },
  { label: 'Podcasts', query: 'Podcasts' },
  { label: 'Live Streams', query: 'Live' },
  { label: 'Tech', query: 'Tech' },
];

export type SearchDropdownItem = {
  key: string;
  type: 'recent' | 'explore' | 'video' | 'playlist' | 'channel' | 'category';
  primary: string;
  suffix?: string;
  value: string;
};

function loadHistory(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(key: string, items: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, 10)));
  } catch {
    // ignore
  }
}

export function HeaderSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    setSearchHistory(loadHistory(SEARCH_HISTORY_KEY));
  }, []);

  useEffect(() => {
    try {
      setAllPlaylists(getAllPlaylists() as Playlist[]);
    } catch {
      setAllPlaylists([]);
    }
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

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addToHistory = (q: string) => {
    const existing = loadHistory(SEARCH_HISTORY_KEY).filter(
      (item) => item.toLowerCase() !== q.toLowerCase()
    );
    const updated = [q, ...existing];
    saveHistory(SEARCH_HISTORY_KEY, updated);
    setSearchHistory(updated);
  };

  const deleteHistoryItem = (q: string) => {
    const updated = searchHistory.filter((item) => item !== q);
    saveHistory(SEARCH_HISTORY_KEY, updated);
    setSearchHistory(updated);
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

  const isBroadKeyword = (q: string): boolean => {
    const broad = [
      'music',
      'coding',
      'vlog',
      'video',
      'playlist',
      'tutorial',
      'tech',
      'entertainment',
    ];
    return broad.some((b) => q.toLowerCase().includes(b));
  };

  const isSpecificMatch = (hay: string, needle: string): boolean => {
    const h = hay.toLowerCase().trim();
    const n = needle.toLowerCase().trim();
    return h === n || h.startsWith(n) || n.startsWith(h);
  };

  const calculateRankScore = (
    type: 'video' | 'playlist' | 'channel' | 'category',
    titleMatch: number,
    nameMatch: number,
    categoryMatch: number,
    popularity: number,
    isExactMatch: boolean,
    query: string
  ): number => {
    const isBroad = isBroadKeyword(query);
    if (isExactMatch) {
      return 100000 + titleMatch + nameMatch * 0.5;
    }
    if (isBroad) {
      if (type === 'video' || type === 'playlist') {
        return titleMatch * 2 + categoryMatch * 1.5 + popularity * 0.01;
      }
      if (type === 'channel') {
        return isExactMatch ? nameMatch * 0.5 + popularity * 0.005 : nameMatch * 0.01;
      }
      return categoryMatch * 1.2 + popularity * 0.01;
    }
    return titleMatch * 3 + nameMatch * 2.5 + categoryMatch * 1 + popularity * 0.005;
  };

  const fuzzyScore = (text: string, q: string): number => {
    const hay = text.toLowerCase();
    const needle = q.toLowerCase();
    if (!needle) return 0;
    if (hay === needle) return 10000;
    if (hay.startsWith(needle)) return 9000;
    const idx = hay.indexOf(needle);
    if (idx >= 0) return 5000 - idx * 10 + needle.length * 5;
    let h = 0;
    let matched = 0;
    for (let n = 0; n < needle.length; n++) {
      const c = needle[n];
      while (h < hay.length && hay[h] !== c) h++;
      if (h === hay.length) return 0;
      matched++;
      h++;
    }
    return 1000 + matched * 10;
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

  useEffect(() => {
    const q = debouncedQuery;
    if (!q) {
      setLiveResults({ videos: [], playlists: [], channels: [], categories: [] });
      return;
    }

    const videoCandidates: Array<{
      item: SearchDropdownItem;
      rankScore: number;
      popularity: number;
    }> = [];
    const playlistCandidates: Array<{
      item: SearchDropdownItem;
      rankScore: number;
      popularity: number;
    }> = [];
    const channelCandidates: Array<{
      item: SearchDropdownItem;
      rankScore: number;
      popularity: number;
      isVerified?: boolean;
    }> = [];
    const categoryCandidates: Array<{
      item: SearchDropdownItem;
      rankScore: number;
      popularity: number;
    }> = [];

    allVideos.forEach((v) => {
      const titleMatch = fuzzyScore(v.title || '', q);
      const nameMatch = fuzzyScore(v.user?.name || '', q);
      const categoryMatch = fuzzyScore(v.category || '', q);
      if (titleMatch === 0 && nameMatch === 0 && categoryMatch === 0) return;
      const isExactTitle = isSpecificMatch(v.title || '', q);
      const popularity = (v as Video & { views?: number }).views ?? 0;
      const rankScore = calculateRankScore(
        'video',
        titleMatch,
        nameMatch,
        categoryMatch,
        popularity,
        isExactTitle,
        q
      );
      videoCandidates.push({
        item: {
          key: `video-${v.id}`,
          type: 'video',
          primary: v.title || 'Untitled',
          suffix: 'Video',
          value: v.title || '',
        },
        rankScore,
        popularity,
      });
    });

    (allPlaylists as (Playlist & { creatorName?: string; type?: string; videoCount?: number })[]).forEach(
      (p) => {
        const titleMatch = fuzzyScore(p.title || '', q);
        const nameMatch = fuzzyScore(p.creatorName || '', q);
        const categoryMatch = fuzzyScore(p.type || '', q);
        if (titleMatch === 0 && nameMatch === 0 && categoryMatch === 0) return;
        const isExactTitle = isSpecificMatch(p.title || '', q);
        const popularity = p.videoCount || 0;
        const rankScore = calculateRankScore(
          'playlist',
          titleMatch,
          nameMatch,
          categoryMatch,
          popularity,
          isExactTitle,
          q
        );
        playlistCandidates.push({
          item: {
            key: `playlist-${p.id}`,
            type: 'playlist',
            primary: p.title || 'Untitled',
            suffix: 'Playlist',
            value: p.title || '',
          },
          rankScore,
          popularity,
        });
      }
    );

    const channelMap = new Map<
      string,
      { id: string; name: string; subs: number; verified: boolean }
    >();
    allVideos.forEach((v) => {
      if (!v.user?.name) return;
      const id = (v.user as { id?: string })?.id || v.userId || v.user?.name;
      if (!channelMap.has(id)) {
        channelMap.set(id, {
          id,
          name: v.user.name,
          subs: Math.floor(Math.random() * 1000000) + 1000,
          verified: Math.random() > 0.7,
        });
      }
    });

    Array.from(channelMap.values()).forEach((c) => {
      const nameMatch = fuzzyScore(c.name, q);
      if (nameMatch === 0) return;
      const isExactName = isSpecificMatch(c.name, q);
      const rankScore = calculateRankScore(
        'channel',
        0,
        nameMatch,
        0,
        c.subs,
        isExactName,
        q
      );
      channelCandidates.push({
        item: {
          key: `channel-${c.id}`,
          type: 'channel',
          primary: c.name,
          suffix: 'Channel',
          value: c.name,
        },
        rankScore,
        popularity: c.subs,
        isVerified: c.verified,
      });
    });

    const catCounts = new Map<string, number>();
    allVideos.forEach((v) => {
      if (!v.category) return;
      catCounts.set(v.category, (catCounts.get(v.category) || 0) + 1);
    });
    Array.from(catCounts.entries()).forEach(([cat, count]) => {
      const categoryMatch = fuzzyScore(cat, q);
      if (categoryMatch === 0) return;
      const isExactCategory = isSpecificMatch(cat, q);
      const rankScore = calculateRankScore(
        'category',
        0,
        0,
        categoryMatch,
        count,
        isExactCategory,
        q
      );
      categoryCandidates.push({
        item: {
          key: `category-${cat}`,
          type: 'category',
          primary: cat,
          suffix: 'Category',
          value: cat,
        },
        rankScore,
        popularity: count,
      });
    });

    const sortByRank = <T extends { rankScore: number; popularity: number }>(
      arr: T[]
    ): T[] =>
      arr.sort((a, b) => {
        if (Math.abs(b.rankScore - a.rankScore) > 100)
          return b.rankScore - a.rankScore;
        if (b.popularity !== a.popularity) return b.popularity - a.popularity;
        return 0;
      });

    const sortedVideos = sortByRank(videoCandidates)
      .slice(0, MAX_SUGGESTION_ITEMS)
      .map((x) => x.item);
    const sortedPlaylists = sortByRank(playlistCandidates)
      .slice(0, MAX_SUGGESTION_ITEMS)
      .map((x) => x.item);
    const sortedCategories = sortByRank(categoryCandidates)
      .slice(0, 10)
      .map((x) => x.item);
    const sortedChannels = channelCandidates
      .sort((a, b) => {
        if (Math.abs(b.rankScore - a.rankScore) > 100)
          return b.rankScore - a.rankScore;
        if (b.popularity !== a.popularity) return b.popularity - a.popularity;
        if (a.isVerified !== b.isVerified) return b.isVerified ? 1 : -1;
        return 0;
      })
      .map((x) => x.item);

    setLiveResults({
      videos: sortedVideos,
      playlists: sortedPlaylists,
      channels: sortedChannels,
      categories: sortedCategories,
    });
  }, [debouncedQuery, allVideos, allPlaylists]);

  const recentItems: SearchDropdownItem[] = useMemo(
    () =>
      searchHistory.slice(0, MAX_HISTORY_ITEMS).map((h, i) => ({
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
    if (debouncedQuery.length === 0) {
      const recentShown = recentItems.slice(0, MAX_HISTORY_ITEMS);
      const remaining = Math.max(0, MAX_EMPTY_TOTAL_ITEMS - recentShown.length);
      const exploreShown = exploreItems.slice(0, remaining);
      return [...recentShown, ...exploreShown];
    }
    const MAX_DEFAULT_CREATORS = 2;
    const channelsToShow = liveResults.channels.slice(0, MAX_DEFAULT_CREATORS);
    return [
      ...channelsToShow,
      ...liveResults.videos,
      ...liveResults.playlists,
      ...liveResults.categories,
    ].slice(0, MAX_SUGGESTION_ITEMS);
  }, [debouncedQuery, exploreItems, recentItems, liveResults]);

  const MAX_DEFAULT_CREATORS = 2;
  const channelsToShow = liveResults.channels.slice(0, MAX_DEFAULT_CREATORS);
  const typingResultsList: SearchDropdownItem[] = useMemo(
    () => [
      ...channelsToShow,
      ...liveResults.videos,
      ...liveResults.playlists,
      ...liveResults.categories,
    ],
    [
      channelsToShow,
      liveResults.videos,
      liveResults.playlists,
      liveResults.categories,
    ]
  );
  const actualItemCount =
    debouncedQuery.length === 0 ? visibleItems.length : typingResultsList.length;

  return (
    <form
      onSubmit={(e) => handleSearch(e)}
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
            setSearchHistory(loadHistory(SEARCH_HISTORY_KEY));
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
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (actualItemCount === 0) return;
              setActiveIndex((prev) => (prev + 1) % actualItemCount);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (actualItemCount === 0) return;
              setActiveIndex((prev) => (prev - 1 + actualItemCount) % actualItemCount);
            } else if (e.key === 'Enter') {
              if (activeIndex >= 0 && activeIndex < actualItemCount) {
                e.preventDefault();
                const item =
                  debouncedQuery.length === 0
                    ? visibleItems[activeIndex]
                    : typingResultsList[activeIndex];
                if (item) selectDropdownItem(item);
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

        {showSearchDropdown && (
          <div className="absolute left-0 top-full mt-2 w-full z-60">
            <div className="bg-surface border border-gray-700 rounded-lg overflow-hidden">
              <div
                id="search-suggestions"
                role="listbox"
                className="h-auto max-h-[80vh] overflow-auto"
              >
                {debouncedQuery.length === 0 ? (
                  <>
                    {recentItems.slice(0, MAX_HISTORY_ITEMS).length === 0 ? (
                      <div className="px-4 py-2 text-sm text-text-secondary">
                        No recent searches
                      </div>
                    ) : (
                      <div className="pb-2">
                        {recentItems.slice(0, MAX_HISTORY_ITEMS).map((item, idx) => (
                          <div
                            key={item.key}
                            role="option"
                            aria-selected={activeIndex === idx}
                            className={cn(
                              'flex items-center justify-between px-3 py-2.5 cursor-pointer',
                              activeIndex === idx ? 'bg-white/10' : 'hover:bg-white/5'
                            )}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectDropdownItem(item)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Clock className="h-4 w-4 text-text-secondary flex-shrink-0" />
                              <span className="text-sm text-text-primary truncate">
                                {item.primary}
                              </span>
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
                        ))}
                      </div>
                    )}
                    <div className="pb-2">
                      {exploreItems
                        .slice(
                          0,
                          Math.max(
                            0,
                            MAX_EMPTY_TOTAL_ITEMS -
                              recentItems.slice(0, MAX_HISTORY_ITEMS).length
                          )
                        )
                        .map((item, idx) => {
                          const flatIndex =
                            recentItems.slice(0, MAX_HISTORY_ITEMS).length + idx;
                          return (
                            <div
                              key={item.key}
                              role="option"
                              aria-selected={activeIndex === flatIndex}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2.5 cursor-pointer',
                                activeIndex === flatIndex ? 'bg-white/10' : 'hover:bg-white/5'
                              )}
                              onMouseEnter={() => setActiveIndex(flatIndex)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectDropdownItem(item)}
                            >
                              <Search className="h-4 w-4 text-text-secondary flex-shrink-0" />
                              <span className="text-sm text-text-primary truncate">
                                {item.primary}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </>
                ) : (
                  (() => {
                    if (typingResultsList.length === 0) {
                      return (
                        <div className="px-4 py-3 text-sm text-text-secondary">
                          No matches
                        </div>
                      );
                    }
                    return (
                      <>
                        {typingResultsList.map((item, idx) => (
                          <div
                            key={item.key}
                            role="option"
                            aria-selected={activeIndex === idx}
                            className={cn(
                              'flex items-center justify-between px-3 py-2.5 cursor-pointer',
                              activeIndex === idx ? 'bg-white/10' : 'hover:bg-white/5'
                            )}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectDropdownItem(item)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Search className="h-4 w-4 text-text-secondary flex-shrink-0" />
                              <span className="text-sm text-text-primary truncate">
                                {renderHighlighted(item.primary, debouncedQuery)}
                              </span>
                            </div>
                          </div>
                        ))}
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
  );
}
