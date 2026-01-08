'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Video, Playlist, User } from '@/types';
import { Play, Crown, Lock, Check, ListMusic, MoreVertical } from 'lucide-react';
import { getAllPlaylists } from '@/data/mockData';

interface ChannelResult {
  id: string;
  name: string;
  avatar?: string;
  subscriberCount: number;
  isVerified?: boolean;
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [channels, setChannels] = useState<ChannelResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPlaylist, setHoveredPlaylist] = useState<string | null>(null);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [showAllCreators, setShowAllCreators] = useState(false);

  // Format time ago helper
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  // Format view count to compact format (e.g., 100K, 1.2M)
  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(0)}K`;
    }
    return views.toString();
  };

  // Format duration in seconds to MM:SS or HH:MM:SS format
  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format subscriber count
  const formatSubscribers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M subscribers`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K subscribers`;
    }
    return `${count} subscribers`;
  };

  // Enhanced ranking: Intent-based scoring with weights (same as Header.tsx)
  const isBroadKeyword = (q: string): boolean => {
    const broad = ['music', 'coding', 'vlog', 'video', 'playlist', 'tutorial', 'tech', 'entertainment'];
    return broad.some(b => q.toLowerCase().includes(b));
  };

  const isSpecificMatch = (hay: string, needle: string): boolean => {
    const h = hay.toLowerCase().trim();
    const n = needle.toLowerCase().trim();
    return h === n || h.startsWith(n) || n.startsWith(h);
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

  const calculateRankScore = (
    type: 'video' | 'playlist' | 'channel',
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
    } else {
      return titleMatch * 3 + nameMatch * 2.5 + categoryMatch * 1 + popularity * 0.005;
    }
  };

  // Simple local search - filter videos, playlists, and channels
  useEffect(() => {
    async function performSearch() {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      if (!query.trim()) {
        setVideos([]);
        setPlaylists([]);
        setChannels([]);
        setShowAllCreators(false);
        setLoading(false);
        return;
      }

      try {
        const q = query.trim();
        setShowAllCreators(false);

        // Fetch all videos from API
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/videos', { headers });
        if (response.ok) {
          const data = await response.json();
          const allVideos = data.videos || [];
          
          // Rank and filter videos using smart ranking
          const videoCandidates = allVideos
            .map((v: Video) => {
              const titleMatch = fuzzyScore(v.title || '', q);
              const nameMatch = fuzzyScore(v.user?.name || '', q);
              const categoryMatch = fuzzyScore(v.category || '', q);
              if (titleMatch === 0 && nameMatch === 0 && categoryMatch === 0) return null;

              const isExactTitle = isSpecificMatch(v.title || '', q);
              const popularity = (v as any).views || 0;
              const rankScore = calculateRankScore(
                'video',
                titleMatch,
                nameMatch,
                categoryMatch,
                popularity,
                isExactTitle,
                q
              );

              return { video: v, rankScore, popularity };
            })
            .filter((x: { video: Video; rankScore: number; popularity: number } | null): x is { video: Video; rankScore: number; popularity: number } => x !== null)
            .sort((a: { video: Video; rankScore: number; popularity: number }, b: { video: Video; rankScore: number; popularity: number }) => {
              if (Math.abs(b.rankScore - a.rankScore) > 100) return b.rankScore - a.rankScore;
              return b.popularity - a.popularity;
            })
            .map((x: { video: Video; rankScore: number; popularity: number }) => x.video);
          
          setVideos(videoCandidates);

          // Extract and rank channels/creators
          const channelMap = new Map<string, { channel: ChannelResult; rankScore: number; popularity: number }>();
          allVideos.forEach((video: Video) => {
            if (video.user) {
              const userId = video.user.id || video.userId || 'unknown';
              if (!channelMap.has(userId)) {
                const nameMatch = fuzzyScore(video.user.name || '', q);
                if (nameMatch === 0) return;

                const isExactName = isSpecificMatch(video.user.name || '', q);
                const subs = Math.floor(Math.random() * 1000000) + 1000;
                const rankScore = calculateRankScore(
                  'channel',
                  0,
                  nameMatch,
                  0,
                  subs,
                  isExactName,
                  q
                );

                channelMap.set(userId, {
                  channel: {
                    id: userId,
                    name: video.user.name || 'Unknown Creator',
                    avatar: video.user.profileImageUrl,
                    subscriberCount: subs,
                    isVerified: Math.random() > 0.7,
                  },
                  rankScore,
                  popularity: subs,
                });
              }
            }
          });
          
          const sortedChannels = Array.from(channelMap.values())
            .sort((a: { channel: ChannelResult; rankScore: number; popularity: number }, b: { channel: ChannelResult; rankScore: number; popularity: number }) => {
              if (Math.abs(b.rankScore - a.rankScore) > 100) return b.rankScore - a.rankScore;
              if (b.popularity !== a.popularity) return b.popularity - a.popularity;
              if (a.channel.isVerified !== b.channel.isVerified) return b.channel.isVerified ? 1 : -1;
              return 0;
            })
            .map((x: { channel: ChannelResult; rankScore: number; popularity: number }) => x.channel);
          
          setChannels(sortedChannels);
        }
        
        // Search and rank playlists
        const allPlaylists = getAllPlaylists();
        const playlistCandidates = allPlaylists
          .map((p: any) => {
            const titleMatch = fuzzyScore(p.title || '', q);
            const nameMatch = fuzzyScore(p.creatorName || '', q);
            const categoryMatch = fuzzyScore(p.type || '', q);
            if (titleMatch === 0 && nameMatch === 0 && categoryMatch === 0) return null;

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

            return { playlist: p, rankScore, popularity };
          })
          .filter((x: { playlist: any; rankScore: number; popularity: number } | null): x is { playlist: any; rankScore: number; popularity: number } => x !== null)
          .sort((a: { playlist: any; rankScore: number; popularity: number }, b: { playlist: any; rankScore: number; popularity: number }) => {
            if (Math.abs(b.rankScore - a.rankScore) > 100) return b.rankScore - a.rankScore;
            return b.popularity - a.popularity;
          })
          .map((x: { playlist: any; rankScore: number; popularity: number }) => x.playlist);
        
        setPlaylists(playlistCandidates);
      } catch (error) {
        console.error('Error searching videos:', error);
      } finally {
        setLoading(false);
      }
    }
    
    performSearch();
  }, [query]);

  if (loading) {
    return (
      <div className="w-full px-4 md:px-6 lg:px-8 py-6">
        <div className="text-center text-text-secondary">Searching...</div>
      </div>
    );
  }

  const allResultsCount = channels.length + playlists.length + videos.length;

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-[1280px] mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-white">
        Search results for &quot;{query}&quot;
      </h1>
      
        {allResultsCount === 0 ? (
        <div className="text-center py-12 text-text-secondary">
            <p>No results found for &quot;{query}&quot;</p>
        </div>
      ) : (
          <div className="space-y-3">
          {/* Channels Results - Horizontal List Layout */}
          {channels.length > 0 && (
            <>
              {(showAllCreators ? channels : channels.slice(0, 2)).map((channel) => (
            <Link
              key={channel.id}
              href={`/creator/${channel.id}`}
              className="group flex flex-col md:flex-row items-center gap-6 rounded-xl transition-all duration-200 hover:bg-white/5 p-4"
              onMouseEnter={() => setHoveredChannel(channel.id)}
              onMouseLeave={() => setHoveredChannel(null)}
            >
              {/* Left Side - Circular Avatar (40% Width Container) */}
              <div className="relative w-full md:w-[40%] flex-shrink-0 flex items-center justify-center">
                <div className="w-[136px] h-[136px] rounded-full overflow-hidden bg-surface border-4 border-background">
                  {channel.avatar ? (
                    <img
                      src={channel.avatar}
                      alt={channel.name}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        hoveredChannel === channel.id ? 'scale-[1.02]' : 'scale-100'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="h-12 w-12 text-text-secondary" />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Metadata */}
              <div className="flex-1 min-w-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pl-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-white line-clamp-1">
                      {channel.name}
                    </h3>
                    {channel.isVerified && (
                      <Check className="h-5 w-5 text-accent flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    @{channel.name.toLowerCase().replace(/\s+/g, '')} • {formatSubscribers(channel.subscriberCount)}
                  </p>
                  {/* Bio/Description - Max 2 lines */}
                  <p className="text-sm text-text-secondary line-clamp-2">
                    Creator on Twinkle platform. Follow for the latest content and updates.
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Handle subscribe logic
                  }}
                  className="px-4 py-2 bg-accent text-white rounded-full text-sm font-semibold hover:bg-accent/90 transition-colors flex-shrink-0"
                >
                  Subscribe
                </button>
              </div>
            </Link>
          ))}
              {!showAllCreators && channels.length > 2 && (
                <button
                  onClick={() => setShowAllCreators(true)}
                  className="w-full text-center py-2 text-text-secondary hover:bg-white/5 rounded-lg transition-colors text-sm"
                >
                  View all {channels.length} creators
                </button>
              )}
              {showAllCreators && channels.length > 2 && (
                <button
                  onClick={() => setShowAllCreators(false)}
                  className="w-full text-center py-2 text-text-secondary hover:bg-white/5 rounded-lg transition-colors text-sm"
                >
                  View less
                </button>
              )}
              <div className="w-full border-t border-white/10 my-4" />
            </>
          )}

          {/* Mixed Content: Videos and Playlists merged */}
          {(() => {
            // Merge videos and playlists into a single array (already sorted by relevance)
            type MixedContentItem = { type: 'video'; data: Video } | { type: 'playlist'; data: any };
            
            const mixedContent: MixedContentItem[] = [
              ...videos.map((v) => ({ type: 'video' as const, data: v })),
              ...playlists.map((p) => ({ type: 'playlist' as const, data: p })),
            ];
            
            return mixedContent.map((item) => {
              if (item.type === 'video') {
                const video = item.data;
                return (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className="group flex flex-col md:flex-row items-start gap-6 rounded-xl transition-all duration-200 hover:bg-white/5 p-4"
                    onMouseEnter={() => setHoveredVideo(video.id)}
                    onMouseLeave={() => setHoveredVideo(null)}
                  >
                    {/* Left Side - Thumbnail (40% Width) */}
                    <div className="relative w-full md:w-[40%] flex-shrink-0 aspect-video bg-surface rounded-xl overflow-hidden">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className={`w-full h-full object-cover transition-transform duration-300 ${
                            hoveredVideo === video.id ? 'scale-[1.02]' : 'scale-100'
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-12 w-12 text-text-secondary" />
                        </div>
                      )}
                      
                      {/* Duration Badge - Bottom Right Corner */}
                      {!video.isLive && video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                      
                      {/* LIVE Badge - Top Right Corner */}
                      {video.isLive && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          <span>LIVE</span>
                        </div>
                      )}
                    </div>

                    {/* Right Side - Metadata */}
                    <div className="flex-1 min-w-0 pl-6 flex flex-col gap-2 items-start">
                      {/* Title Row - Title + More Button */}
                      <div className="flex justify-between items-start w-full gap-4">
                        <h3 className="text-xl font-semibold text-white line-clamp-2 leading-snug group-hover:text-white/90 flex-1 min-w-0">
                          {video.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="text-text-secondary hover:text-white transition-colors flex-shrink-0 p-1 rounded-full hover:bg-white/10"
                          aria-label="More options"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Stats Row - Views • Time ago */}
                      <div className="flex flex-wrap items-center gap-1.5 text-sm text-white/70">
                        {video.isLive ? (
                          <span className="text-white font-semibold">
                            {video.liveViewers ? `${formatViews(video.liveViewers)} watching` : 'Live'}
                          </span>
                        ) : (
                          <>
                            <span>{formatViews(video.views)} views</span>
                            <span>•</span>
                            <span>{formatTimeAgo(video.createdAt)}</span>
                          </>
                        )}
                      </div>

                      {/* Creator Row - Small avatar (h-6 w-6) + Channel Name */}
                      <div className="flex items-center gap-2">
                        {video.user?.profileImageUrl ? (
                          <img
                            src={video.user.profileImageUrl}
                            alt={video.user.name || 'Creator'}
                            className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                            <Play className="h-3 w-3 text-text-secondary" />
                          </div>
                        )}
                        <span className="text-sm text-white/70">
                          {video.user?.name || 'Unknown Creator'}
                        </span>
                        {video.user && 'role' in video.user && video.user.role === 'creator' && (
                          <Check className="h-4 w-4 text-accent flex-shrink-0" />
                        )}
                      </div>

                      {/* Description Snippet - One line preview */}
                      {video.description && (
                        <p className="text-sm text-white/60 line-clamp-1">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              } else {
                const playlist = item.data;
                const thumbnailUrl = playlist.thumbnail || playlist.firstVideoThumbnail;
                return (
                  <Link
                    key={playlist.id}
                    href={`/playlist/${playlist.id}`}
                    className="group flex flex-col md:flex-row items-start gap-6 rounded-xl transition-all duration-200 hover:bg-white/5 p-4"
                    onMouseEnter={() => setHoveredPlaylist(playlist.id)}
                    onMouseLeave={() => setHoveredPlaylist(null)}
                  >
                {/* Left Side - Thumbnail with Stacked Card Effect (40% Width) */}
                <div className="relative w-full md:w-[40%] flex-shrink-0 aspect-video">
                  {/* Stack Background Layers - Twinkle Design System */}
                  <div className="absolute -top-1 -right-1 w-full h-full bg-zinc-800 rounded-xl -z-[1]" />
                  <div className="absolute -top-2 -right-2 w-full h-full bg-zinc-800 rounded-xl -z-[2]" />
                  
                  {/* Main Thumbnail */}
                  <div className="relative w-full h-full aspect-video bg-surface rounded-xl overflow-hidden">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={playlist.title}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          hoveredPlaylist === playlist.id ? 'scale-[1.02]' : 'scale-100'
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-12 w-12 text-text-secondary" />
                      </div>
                    )}
                  </div>

                  {/* Playlist Type Badge - Bottom Right Corner */}
                  <div className="absolute bottom-2 right-2 z-30">
                    <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-xs font-semibold">
                      {playlist.type}
                    </div>
                  </div>

                  {/* Price/Subscription Label - Top Right Corner */}
                  {playlist.price || playlist.isSubscription ? (
                    <div className="absolute top-2 right-2 z-30">
                      {playlist.isSubscription ? (
                        <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
                          <Crown className="h-3 w-3" />
                          <span>Subscription</span>
                        </div>
                      ) : playlist.price ? (
                        <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
                          <Lock className="h-3 w-3" />
                          <span>{playlist.price}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Right Side - Metadata */}
                <div className="flex-1 min-w-0 pl-6 flex flex-col gap-2 items-start">
                  {/* Title Row - Title + More Button */}
                  <div className="flex justify-between items-start w-full gap-4">
                    <h3 className="text-xl font-semibold text-white line-clamp-2 leading-snug group-hover:text-white/90 flex-1 min-w-0">
                      {playlist.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Handle more menu logic
                      }}
                      className="text-text-secondary hover:text-white transition-colors flex-shrink-0 p-1 rounded-full hover:bg-white/10"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Creator Row - Avatar + Channel Name */}
                  <div className="flex items-center gap-2">
                    {playlist.creatorAvatar ? (
                      <img
                        src={playlist.creatorAvatar}
                        alt={playlist.creatorName}
                        className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                        <Play className="h-3 w-3 text-text-secondary" />
            </div>
          )}
                    <span className="text-sm text-white/70">
                      {playlist.creatorName}
                    </span>
                  </div>

                  {/* View Full Playlist Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/playlist/${playlist.id}`);
                    }}
                    className="text-sm text-accent hover:text-accent/80 font-medium mt-1 text-left"
                  >
                    View full playlist
                  </button>
                </div>
              </Link>
                );
              }
            });
          })()}
          </div>
        )}
      </div>
    </div>
  );
}
