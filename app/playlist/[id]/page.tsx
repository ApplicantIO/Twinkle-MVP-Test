'use client';

import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Playlist, Video } from '@/types';
import { getPlaylistById } from '@/data/mockData';
import { Share2, Bookmark, MoreVertical, Lock, Crown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModal } from '@/contexts/ModalContext';
import { usePurchase } from '@/contexts/PurchaseContext';
import { formatRelativeTime, formatExactDate } from '@/lib/utils';
import { MonetizationCTASection } from '@/components/MonetizationCTASection';
import { X } from 'lucide-react';
import { getPlaylistProgress } from '@/lib/watchHistory';

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [openMenuVideoId, setOpenMenuVideoId] = useState<string | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showPurchaseFlow, setShowPurchaseFlow] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { openShareModal, openReportModal } = useModal();
  const { checkPlaylistPurchased, refreshPurchases } = usePurchase();
  
  // Check purchase status using context
  const hasPurchasedPlaylist = checkPlaylistPurchased(playlistId);
  
  // Watch history state (to trigger re-renders when watch history changes)
  const [watchHistoryKey, setWatchHistoryKey] = useState(0);
  
  // Get playlist progress (reactive to changes)
  const playlistProgress = useMemo(() => getPlaylistProgress(playlistId), [playlistId, watchHistoryKey]);
  const hasStarted = playlistProgress !== null;
  const lastVideoId = playlistProgress?.lastVideoId;
  const menuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [showDescriptionFade, setShowDescriptionFade] = useState(false);

  // Load playlist data
  useEffect(() => {
    const playlistData = getPlaylistById(playlistId);
    if (playlistData) {
      setPlaylist(playlistData);
    } else {
      setLoading(false);
    }
  }, [playlistId]);

  // Refresh purchases when component mounts or when purchase events occur
  useEffect(() => {
    refreshPurchases();
    
    // Listen for purchase events
    const handlePurchaseEvent = () => {
      refreshPurchases();
    };
    
    // Listen for watch history and playlist progress changes (via custom events)
    const handleWatchHistoryUpdate = () => {
      setWatchHistoryKey(prev => prev + 1);
    };
    
    const handlePlaylistProgressUpdate = () => {
      setWatchHistoryKey(prev => prev + 1);
    };
    
    window.addEventListener('playlistPurchased', handlePurchaseEvent);
    window.addEventListener('storage', handlePurchaseEvent);
    window.addEventListener('watchHistoryUpdated', handleWatchHistoryUpdate);
    window.addEventListener('playlistProgressUpdated', handlePlaylistProgressUpdate);
    
    return () => {
      window.removeEventListener('playlistPurchased', handlePurchaseEvent);
      window.removeEventListener('storage', handlePurchaseEvent);
      window.removeEventListener('watchHistoryUpdated', handleWatchHistoryUpdate);
      window.removeEventListener('playlistProgressUpdated', handlePlaylistProgressUpdate);
    };
  }, [refreshPurchases]);

  // Load videos
  useEffect(() => {
    async function loadVideos() {
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/videos', { headers });
        if (response.ok) {
          const data = await response.json();
          const allVideos = data.videos || [];
          
          // Filter videos that belong to this playlist and order by creator-defined order
          // Only use videos that actually exist in the API (no ghost content)
          if (playlist) {
            const videoMap = new Map(allVideos.map((v: Video) => [v.id, v]));
            
            // Order videos according to playlist.allVideoIds (creator-defined order)
            // Filter out any video IDs that don't exist in the API
            const orderedVideos = playlist.allVideoIds
              .map(id => videoMap.get(id))
              .filter((v): v is Video => v !== undefined);
            
            setVideos(orderedVideos);
          }
        }
      } catch (error) {
        console.error('Error loading videos:', error);
      } finally {
        setLoading(false);
      }
    }

    if (playlist) {
      loadVideos();
    }
  }, [playlist]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuVideoId(null);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node) && 
          moreButtonRef.current && !moreButtonRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if description text overflows container (for fade-out effect)
  useLayoutEffect(() => {
    const checkOverflow = () => {
      if (descriptionRef.current && !isDescriptionExpanded) {
        const element = descriptionRef.current.querySelector('p');
        if (element) {
          const hasOverflow = element.scrollHeight > element.clientHeight;
          setShowDescriptionFade(hasOverflow);
        }
      } else {
        setShowDescriptionFade(false);
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [playlist?.description, isDescriptionExpanded]);

  // Get filtered videos based on active tab (maintaining creator-defined order)
  const getFilteredVideos = (): Video[] => {
    if (activeTab === 'all') {
      return videos; // Already in creator-defined order
    }
    
    const section = playlist?.sections.find(s => s.id === activeTab);
    if (!section) return videos;
    
    // Order by section's videoIds order (creator-defined order)
    const videoMap = new Map(videos.map(v => [v.id, v]));
    return section.videoIds
      .map(id => videoMap.get(id))
      .filter((v): v is Video => v !== undefined);
  };
  
  // Check if playlist has mixed free and paid content
  const hasMixedContent = useMemo(() => {
    if (!playlist || videos.length === 0) return false;
    const hasFree = videos.some(v => !v.type || v.type === 'free');
    const hasPaid = videos.some(v => v.type === 'paid' || v.type === 'subscription');
    return hasFree && hasPaid;
  }, [playlist, videos]);

  const filteredVideos = getFilteredVideos();

  // Format duration
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

  // Format views
  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(0)}K`;
    }
    return views.toString();
  };

  // Check access (placeholder)
  const hasAccess = false;

  // Get thumbnail: playlist.thumbnail || firstVideo.thumbnail
  const thumbnailUrl = playlist?.thumbnail || playlist?.firstVideoThumbnail;

  // Conditional returns - must be after all hooks
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-text-secondary">Loading playlist...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-error mb-4">Playlist not found</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="w-full h-[calc(100vh-4rem)] flex gap-6 p-6 overflow-hidden max-w-[1920px] mx-auto bg-background">
        {/* Left Sidebar - Fixed, Non-Scrollable (Playlist Metadata) */}
        <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col h-full min-h-0">
          <div className="bg-zinc-900/50 rounded-2xl p-6 space-y-6 h-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-6">
            {/* Thumbnail - Enhanced with border */}
            <div className="relative w-full aspect-video bg-surface rounded-lg overflow-hidden border border-white/5">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface" />
              )}
            </div>

            {/* Playlist Title */}
            <h1 className="text-2xl font-bold text-text-primary">{playlist.title}</h1>

            {/* Creator Attribution */}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>Created by</span>
              <Link
                href={`/creator/${playlist.creatorId || playlist.creatorName.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex items-center gap-2 text-accent hover:text-accent/80 hover:underline font-medium transition-colors"
              >
                {playlist.creatorAvatar && (
                  <img
                    src={playlist.creatorAvatar}
                    alt={playlist.creatorName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span>{playlist.creatorName}</span>
              </Link>
            </div>

            {/* Metadata - Single horizontal line with dots */}
            <div className="flex flex-row items-center gap-x-3 text-sm text-zinc-400">
              <span>{playlist.videoCount} videos</span>
              {playlist.sections.length > 0 && (
                <>
                  <span>·</span>
                  <span>{playlist.sections.length} sections</span>
                </>
              )}
              <span>·</span>
              <span>
                Last updated:{' '}
                <span 
                  className="underline decoration-dotted underline-offset-2 cursor-help"
                  title={formatExactDate(new Date(playlist.lastUpdated))}
                >
                  {formatRelativeTime(new Date(playlist.lastUpdated))}
                </span>
              </span>
            </div>

            {/* Action Row - [Play/Resume] | [Share] | [Save] | [More] */}
            {videos.length > 0 && (
            <div className="flex flex-row items-center gap-2 mt-4">
                {/* Play/Resume Button - flex-1, White background with black icon/text - Always visible */}
                <button
                  className="flex-1 bg-white hover:bg-white/90 rounded-full px-4 py-2 flex items-center justify-center gap-2 transition-colors"
                  onClick={() => {
                    if (hasStarted && lastVideoId) {
                      // Resume: Navigate to last watched video with optional timestamp
                      const timestamp = playlistProgress?.timestamp;
                      const url = timestamp && timestamp > 0
                        ? `/watch/${lastVideoId}?playlistId=${playlist.id}&listContext=true&t=${Math.floor(timestamp)}`
                        : `/watch/${lastVideoId}?playlistId=${playlist.id}&listContext=true`;
                      router.push(url);
                    } else {
                      // Play: Navigate to first video (watch page handles teaser/full content based on purchase)
                      router.push(`/watch/${videos[0].id}?playlistId=${playlist.id}&listContext=true`);
                    }
                  }}
                >
                  <Play className="h-4 w-4 text-black" />
                  <span className="text-sm text-black font-medium">{hasStarted ? 'Resume' : 'Play'}</span>
                </button>

              {/* Share Button - flex-1 */}
              <button
                onClick={() => openShareModal(playlist.id, playlist.title)}
                className="flex-1 bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm">Share</span>
              </button>

              {/* Save Button - flex-1 */}
              <button
                onClick={() => setIsSaved(!isSaved)}
                className="flex-1 bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 flex items-center justify-center gap-2 transition-colors"
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                <span className="text-sm">{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              {/* More Button - Icon only */}
              <div className="relative">
                <button
                  ref={moreButtonRef}
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                
                {isMoreMenuOpen && (
                  <div
                    ref={moreMenuRef}
                    className="absolute left-0 top-full mt-2 w-48 bg-surface border border-surface rounded-lg shadow-xl z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        openReportModal(playlist.id, playlist.title);
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                    >
                      Report
                    </button>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Buy Button - Separate Row (Only if paid and not purchased) */}
            {playlist.price && !hasPurchasedPlaylist && (
              <button
                className="w-full bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 flex items-center justify-center gap-2 transition-colors mt-4 text-sm"
                onClick={() => setShowPurchaseFlow(true)}
              >
                Buy for {playlist.price.replace(/\s+/g, '')}
              </button>
            )}

            {/* Description with Truncation */}
            {playlist.description && (() => {
              const wordCount = playlist.description.split(/\s+/).length;
              const shouldShowToggle = wordCount > 100;
              const displayText = isDescriptionExpanded || !shouldShowToggle
                ? playlist.description
                : playlist.description.split(/\s+/).slice(0, 100).join(' ') + '...';
              
              return (
              <div className="pt-4 border-t border-surface/30 relative">
                <div ref={descriptionRef} className="relative">
                <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {displayText}
                      {shouldShowToggle && !isDescriptionExpanded && (
                        <button
                          onClick={() => setIsDescriptionExpanded(true)}
                          className="text-accent hover:text-accent/80 font-medium ml-1"
                        >
                          ...more
                        </button>
                      )}
                  </p>
                  {shouldShowToggle && isDescriptionExpanded && (
                    <button
                      onClick={() => setIsDescriptionExpanded(false)}
                      className="text-accent hover:text-accent/80 font-medium mt-2 text-sm"
                    >
                      Show less
                    </button>
                  )}
                  {/* Fade-out overlay - Only show when text overflows */}
                  {showDescriptionFade && !isDescriptionExpanded && (
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
                      style={{
                        background: 'linear-gradient(to bottom, transparent, rgba(22, 22, 22, 1))'
                      }}
                    />
                  )}
                </div>
              </div>
              );
            })()}
            </div>
          </div>
        </div>

        {/* Right Content Area - Scrollable (Tabs + Video List) */}
        <div className="flex-1 min-w-0 flex flex-col h-full min-h-0 overflow-hidden">
          {/* Scrollable Container */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide">
            {/* TabBar - Sticky within scrollable container */}
            <div className="sticky top-0 z-30 bg-background pt-2 pb-1">
            <div className="flex items-center gap-4 border-b border-surface/50">
              {/* Tabs - Twinkle Standard Tab Component */}
              <div className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-hide">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                    activeTab === 'all'
                      ? 'border-white text-text-primary font-semibold'
                      : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                  }`}
                >
                  All
                </button>
                {playlist.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                      activeTab === section.id
                        ? 'border-white text-text-primary font-semibold'
                        : 'border-transparent text-text-secondary/70 hover:text-text-primary hover:border-surface/50'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

            {/* Video List - Fixed Layout */}
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <p>No videos in this section.</p>
            </div>
          ) : (
            // List View - Fixed Layout (Dense, zero-gap)
            <div className="space-y-0">
              {filteredVideos.map((video, index) => {
                const isMenuOpen = openMenuVideoId === video.id;
                
                return (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}?playlistId=${playlist.id}&listContext=true`}
                    className={`flex gap-4 rounded-lg p-3 transition-all duration-200 group relative ${
                      hoveredVideo === video.id ? 'bg-white/10' : 'bg-transparent'
                    }`}
                    onMouseEnter={() => setHoveredVideo(video.id)}
                    onMouseLeave={() => setHoveredVideo(null)}
                  >
                    {/* Video Index Number - Compact */}
                    <div className="flex-shrink-0 flex items-center w-6">
                      <span className="text-zinc-500 text-sm text-center w-full">
                        {index + 1}
                      </span>
                    </div>

                    {/* Thumbnail */}
                    <div className="flex-shrink-0 relative w-40 md:w-64 lg:w-72 aspect-video rounded-lg overflow-hidden bg-surface">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface">
                          <span className="text-text-secondary text-xs">No thumbnail</span>
                        </div>
                      )}
                      {/* Last Played Indicator - Purple Badge */}
                      {lastVideoId === video.id && (
                        <div className="absolute top-2 left-2 bg-accent/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 z-20">
                          <Play className="h-3 w-3 fill-current" />
                          <span>Last played</span>
                        </div>
                      )}
                      {!video.isLive && video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <h4 className="text-base font-medium text-text-primary line-clamp-3 group-hover:text-white transition-colors leading-snug">
                          {video.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                          <span>{video.user?.name || 'Unknown Creator'}</span>
                          {!video.isLive && (
                            <>
                              <span>•</span>
                              <span>{formatViews(video.views)} views</span>
                            </>
                          )}
                        </div>
                        
                        {/* Video Description - 2 lines */}
                        {video.description && (
                          <p className="text-zinc-400 text-sm line-clamp-2 mt-1">
                            {video.description}
                          </p>
                        )}
                        
                        {/* Price/Subscription Labels in List View - Twinkle Pill Style */}
                        <div className="flex items-center gap-2 mt-1">
                          {video.type === 'subscription' && (
                            <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
                              <Crown className="h-3 w-3" />
                              <span>Subscription</span>
                            </div>
                          )}
                          
                          {video.type === 'paid' && video.price !== undefined && (
                            <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
                              <Lock className="h-3 w-3" />
                              <span>
                                {video.price.toLocaleString()} {video.currency || 'UZS'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* More Button */}
                      <div className={`flex-shrink-0 relative ${isMenuOpen ? 'z-100' : ''}`}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuVideoId(isMenuOpen ? null : video.id);
                          }}
                          className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                          aria-label="More options"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 bg-surface border border-surface rounded-lg shadow-lg py-1 min-w-[180px] z-100"
                            onClick={(e) => e.stopPropagation()}
                            style={{ zIndex: 9999 }}
                          >
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenMenuVideoId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                            >
                              Save to playlist
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openShareModal(video.id, video.title);
                                setOpenMenuVideoId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                            >
                              Share
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openReportModal(video.id, video.title);
                                setOpenMenuVideoId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                            >
                              Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Purchase Flow Modal */}
      {showPurchaseFlow && playlist.price && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPurchaseFlow(false);
            }
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          {/* Modal Content */}
          <div
            className="relative bg-zinc-900 border border-white/10 rounded-3xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPurchaseFlow(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Purchase Flow Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <MonetizationCTASection
                video={{
                  id: playlist.id,
                  userId: playlist.creatorId || 'playlist-creator',
                  title: playlist.title,
                  description: playlist.description,
                  videoUrl: '',
                  views: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  type: playlist.isSubscription ? 'subscription' : 'paid',
                  price: parseInt(playlist.price.replace(/[^\d]/g, '')) || 50000,
                  currency: 'UZS',
                  user: {
                    id: playlist.creatorId || 'playlist-creator',
                    name: playlist.creatorName,
                    profileImageUrl: playlist.creatorAvatar,
                  },
                }}
                  isPlaylist={true}
                onPurchase={() => {
                    // Purchase started
                }}
                onPurchaseComplete={() => {
                    // Purchase completed - dispatch event for global sync
                    if (typeof window !== 'undefined') {
                      const purchasedPlaylists = JSON.parse(localStorage.getItem('purchasedPlaylists') || '[]');
                      if (!purchasedPlaylists.includes(playlist.id)) {
                        purchasedPlaylists.push(playlist.id);
                        localStorage.setItem('purchasedPlaylists', JSON.stringify(purchasedPlaylists));
                        // Dispatch custom event for cross-component sync
                        window.dispatchEvent(new CustomEvent('playlistPurchased', { detail: { playlistId: playlist.id } }));
                      }
                    }
                  setShowPurchaseFlow(false);
                    refreshPurchases();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

