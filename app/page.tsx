'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import Link from 'next/link';
import { Video, Playlist } from '@/types';
import { Play, Lock, Crown, Volume2, VolumeX, MoreVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { usePurchase } from '@/contexts/PurchaseContext';
import PlaylistCard from '@/components/ui/PlaylistCard';
import { getAllPlaylists } from '@/data/mockData';
import { formatTimeAgo, formatViews, formatDuration } from '@/lib/utils';
import { PRIORITY_VIDEO_IDS_DEMO } from '@/config/viewerConstants';

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists] = useState<Playlist[]>(getAllPlaylists());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [hoveredPlaylist, setHoveredPlaylist] = useState<string | null>(null);
  const [columns, setColumns] = useState(1);
  const { user } = useAuth();

  // Calculate optimal number of columns based on viewport width
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const calculateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) return 1;
      if (width < 768) return 2;
      if (width < 1024) return 2;
      if (width < 1920) return 3; // Laptops: 3 columns (smaller cards)
      return 4; // Large monitors and above: Maximum 4 columns
    };

    const updateColumns = () => {
      setColumns(calculateColumns());
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    window.addEventListener('orientationchange', updateColumns);

    return () => {
      window.removeEventListener('resize', updateColumns);
      window.removeEventListener('orientationchange', updateColumns);
    };
  }, []);

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
          console.log('Videos loaded:', data.videos?.length || 0);
          
          // Sort videos to prioritize test videos at the top
          const sortedVideos = (data.videos || []).sort((a: Video, b: Video) => {
            const aIsTest = PRIORITY_VIDEO_IDS_DEMO.includes(a.id);
            const bIsTest = PRIORITY_VIDEO_IDS_DEMO.includes(b.id);
            
            if (aIsTest && !bIsTest) return -1; // 'a' comes first
            if (!aIsTest && bIsTest) return 1;  // 'b' comes first
            return 0; // Maintain original order for others
          });
          
          setVideos(sortedVideos);
          setError(null);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Error loading videos:', response.status, errorData);
          setError(errorData.error || 'Failed to load videos');
        }
      } catch (error) {
        console.error('Error loading videos:', error);
        setError('Failed to load videos. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, [user]);

  if (loading) {
    return (
      <div className="px-2 md:px-4 lg:px-6 py-8">
        <div className="text-center text-text-secondary">Loading videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 md:px-4 lg:px-6 py-8">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // The API already returns videos in the correct order:
  // - Videos from subscribed creators first (if user is logged in)
  // - Then recommended videos
  // We'll show them all in one grid, but can add visual separation if needed

  // Merge videos and playlists into a single mixed content array
  type MixedContentItem = { type: 'video'; data: Video } | { type: 'playlist'; data: Playlist };
  const mixedContent: MixedContentItem[] = [
    ...videos.map((v) => ({ type: 'video' as const, data: v })),
    ...playlists.map((p) => ({ type: 'playlist' as const, data: p })),
  ];

  return (
    <div className="py-6 md:py-8">
      {/* Mixed Content: Videos and Playlists in one grid */}
      {mixedContent.length > 0 ? (
        <div className="px-2 md:px-4 lg:px-6">
          <h1 className="text-2xl font-bold mb-4 text-text-primary">
            {user ? 'Recommended for you' : 'Recommended'}
          </h1>
          <div
            className="grid gap-0"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {mixedContent.map((item) => {
              if (item.type === 'video') {
                return (
            <VideoCard
                    key={item.data.id}
                    video={item.data}
              hoveredVideo={hoveredVideo}
              setHoveredVideo={setHoveredVideo}
              formatTimeAgo={formatTimeAgo}
              formatViews={formatViews}
              formatDuration={formatDuration}
            />
                );
              } else {
                return (
                  <PlaylistCard
                    key={item.data.id}
                    playlist={item.data}
                    hoveredPlaylist={hoveredPlaylist}
                    setHoveredPlaylist={setHoveredPlaylist}
                  />
                );
              }
            })}
          </div>
        </div>
      ) : (
        <div className="px-2 md:px-4 lg:px-6 text-center py-12">
          <p className="text-text-secondary mb-4">No videos available yet.</p>
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">
              To add videos to your feed, you can:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
              <a
                href="/studio"
                className="px-4 py-2 bg-surface text-text-primary rounded-lg hover:bg-surface/80 text-sm border border-surface"
              >
                Upload Your Own Video
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface VideoCardProps {
  video: Video;
  hoveredVideo: string | null;
  setHoveredVideo: (id: string | null) => void;
  formatTimeAgo: (date: Date) => string;
  formatViews: (views: number) => string;
  formatDuration: (seconds: number) => string;
}

function VideoCard({ video, hoveredVideo, setHoveredVideo, formatTimeAgo, formatViews, formatDuration }: VideoCardProps) {
  const isHovered = hoveredVideo === video.id;
  const { user } = useAuth();
  const { openShareModal, openReportModal } = useModal();
  const { checkVideoPurchased } = usePurchase();
  const [isMuted, setIsMuted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Check if user has access to this content
  // If purchased/subscribed, we won't show any badge
  const isPurchased = video.type === 'paid' ? checkVideoPurchased(video.id) : false;
  const isSubscribed = false; // TODO: Enhance with subscription context when available
  const hasAccess = (video.type === 'paid' && isPurchased) || (video.type === 'subscription' && isSubscribed);

  // Try to get a preview image for YouTube videos
  const getPreviewImage = () => {
    if (!video.videoUrl) return video.thumbnailUrl;
    
    // For YouTube embed URLs, extract video ID and use YouTube thumbnail API
    const youtubeMatch = video.videoUrl.match(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^&\n?#]+)/);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      // Use maxresdefault for better quality, fallback to hqdefault
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    
    return video.thumbnailUrl;
  };

  const previewImage = getPreviewImage();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);
  
  return (
          <Link
            href={`/watch/${video.id}`}
      className={`group cursor-pointer flex flex-col relative ${isMenuOpen ? 'z-[10]' : ''}`}
      onMouseEnter={() => setHoveredVideo(video.id)}
      onMouseLeave={() => setHoveredVideo(null)}
    >
      {/* Card Container - flat design with uniform neutral hover effect */}
      <div
        className={`rounded-xl transition-colors duration-200 p-3 relative ${isMenuOpen ? 'z-[10]' : ''} ${
          isHovered ? 'bg-white/5' : 'bg-transparent'
        }`}
      >
        {/* Thumbnail Container */}
        <div className="relative w-full aspect-video bg-surface rounded-lg overflow-hidden mb-3">
              {video.thumbnailUrl ? (
          <>
            {/* Default thumbnail */}
                <img
              ref={imgRef}
                  src={video.thumbnailUrl}
                  alt=""
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                // Hide image on error and show placeholder
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Preview image on hover (for YouTube videos) */}
            {previewImage && previewImage !== video.thumbnailUrl && (
              <img
                src={previewImage}
                alt=""
                crossOrigin="anonymous"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                onError={(e) => {
                  // Fallback to original thumbnail if preview fails
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface">
            {/* No play icon - clean look */}
          </div>
        )}
        
        {/* Duration Badge - Bottom Right Corner (hidden for live videos) */}
        {!video.isLive && video.duration && (
          <div className="absolute bottom-2 right-2 bg-background/80 text-text-primary px-1.5 py-0.5 rounded text-xs font-semibold z-[5]">
            {formatDuration(video.duration)}
          </div>
        )}
        
        {/* Overlays Container - Top Right Corner */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-2 z-[5]">
          {/* Labels Container - Horizontal layout when multiple labels exist */}
          {/* Only show badges if content is locked/unpaid OR if it's live */}
          {(video.isLive || (!hasAccess && (video.type === 'subscription' || (video.type === 'paid' && video.price !== undefined)))) && (
            <div className="flex items-center gap-2">
              {/* Subscription Label - Only show if user doesn't have access */}
              {video.type === 'subscription' && !hasAccess && (
                <div className="bg-background/80 backdrop-blur-sm text-text-primary px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <Crown className="h-3 w-3" />
                  <span>Subscription</span>
                </div>
              )}
              
              {/* Paid Video Label - Only show if user doesn't have access */}
              {video.type === 'paid' && video.price !== undefined && !hasAccess && (
                <div className="bg-background/80 backdrop-blur-sm text-text-primary px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <Lock className="h-3 w-3" />
                  <span>
                    {video.price.toLocaleString()} {video.currency || 'UZS'}
                  </span>
                </div>
              )}
              
              {/* LIVE Label - Right side (always last) */}
              {video.isLive && (
                <div className="bg-error text-text-primary px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span>LIVE</span>
                </div>
              )}
            </div>
          )}
          
          {/* Mute/Unmute Button - Below labels, only on hover */}
          {isHovered && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="bg-background/80 backdrop-blur-md text-text-primary p-2 rounded-full hover:bg-background transition-all duration-200"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        </div>
        
        {/* Video Info - 3-Column YouTube Layout */}
        <div className="flex items-start gap-3 mt-3">
          {/* Column 1: Avatar */}
          <div className="flex-shrink-0 relative">
            {video.user?.profileImageUrl ? (
              <>
                 <img
                   src={video.user.profileImageUrl}
                   alt={video.user.name || 'Creator'}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {/* Live Indicator Dot - Red circle on avatar */}
                {video.isLive && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-background z-10"></div>
                )}
              </>
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center relative">
                {/* No icon - clean look */}
                {/* Live Indicator Dot - Red circle on avatar */}
                {video.isLive && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-background z-10"></div>
                )}
              </div>
            )}
          </div>
          
          {/* Column 2: Details Block (Flex-Grow) */}
              <div className="flex-1 min-w-0">
            {/* Title - Always white, no color change on hover */}
            <h3 className="font-medium text-sm text-text-primary line-clamp-2 mb-1 leading-5">
                  {video.title}
                </h3>
            
            {/* Channel Name, Views/Live Viewers, Date - Semi-transparent */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-secondary">
              <span className="line-clamp-1">{video.user?.name || 'Unknown Creator'}</span>
              <span>•</span>
              {video.isLive ? (
                <span className="text-text-primary font-semibold">
                  {video.liveViewers ? `${formatViews(video.liveViewers)} watching` : 'Live'}
                </span>
              ) : (
                <span>{formatViews(video.views)} views</span>
              )}
              {!video.isLive && (
                <>
                  <span>•</span>
                  <span>{formatTimeAgo(video.createdAt)}</span>
                </>
              )}
            </div>
      </div>
          
          {/* Column 3: More Icon (3 dots) - Discreet, doesn't take ambient color */}
          <div className={`flex-shrink-0 relative ${isMenuOpen ? 'z-[10]' : ''}`}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-full hover:bg-accent/10"
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1 bg-surface border border-surface rounded-lg shadow-lg py-1 min-w-[180px] z-[10]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    // TODO: Implement save to playlist
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-accent/10 transition-colors"
                >
                  Save to playlist
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    openShareModal(video.id, video.title);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-accent/10 transition-colors"
                >
                  Share
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    openReportModal(video.id, video.title);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-accent/10 transition-colors"
                >
                  Report
                </button>
        </div>
      )}
    </div>
        </div>
      </div>
    </Link>
  );
}
