'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import Link from 'next/link';
import { Video } from '@/types';
import { Play, Lock, Crown, Volume2, VolumeX, MoreVertical } from 'lucide-react';
import { FastAverageColor } from 'fast-average-color';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [columns, setColumns] = useState(1);
  const { user } = useAuth();

  // Calculate optimal number of columns based on viewport width
  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) return 1;
      if (width < 768) return 2;
      if (width < 1024) return 2;
      if (width < 1920) return 3; // Laptops: 3 columns (smaller cards)
      if (width < 2560) return 4; // Larger monitors: 4 columns
      return 5; // Very large displays: 5 columns
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
          const TEST_VIDEO_IDS = [
            'twinkle_live_video_test',
            'twinkle_paid_content',
            'twinkle_membership_content',
          ];
          
          const sortedVideos = (data.videos || []).sort((a: Video, b: Video) => {
            const aIsTest = TEST_VIDEO_IDS.includes(a.id);
            const bIsTest = TEST_VIDEO_IDS.includes(b.id);
            
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-text-secondary">Loading videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
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

  return (
    <div className="pt-2 pb-4 md:pt-3 md:pb-6 lg:pt-4 lg:pb-8">
      <h1 className="text-2xl font-bold mb-3 text-white px-4 md:px-6 lg:px-8">
        {user ? 'Recommended for you' : 'Recommended'}
      </h1>
      <div 
        className="grid gap-x-0 gap-y-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              hoveredVideo={hoveredVideo}
              setHoveredVideo={setHoveredVideo}
              formatTimeAgo={formatTimeAgo}
              formatViews={formatViews}
              formatDuration={formatDuration}
            />
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">No videos available yet.</p>
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">
              To add videos to your feed, you can:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
              <a
                href="/admin/import"
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm"
              >
                Import YouTube Channel
              </a>
              <span className="text-text-secondary text-sm">or</span>
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
  const [glowColor, setGlowColor] = useState<string>('#947CF2'); // Default to Twinkle Purple
  const [isMuted, setIsMuted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Check if user has access to subscription/purchased content
  // TODO: Replace with actual subscription/purchase check from API
  const hasAccess = false; // Placeholder - should check user's subscriptions/purchases

  // Extract dominant color from thumbnail using FastAverageColor
  useEffect(() => {
    if (!video.thumbnailUrl || !imgRef.current || !imageLoaded) return;

    const fac = new FastAverageColor();
    
    fac.getColorAsync(imgRef.current)
      .then((color) => {
        // Check if color is too dark/light (black/white) and use fallback
        const rgba = color.value; // [R, G, B, A]
        const brightness = (rgba[0] * 299 + rgba[1] * 587 + rgba[2] * 114) / 1000;
        
        // If color is too dark (< 30) or too light (> 220), use default
        if (brightness < 30 || brightness > 220) {
          setGlowColor('#947CF2'); // Twinkle Purple fallback
        } else {
          setGlowColor(color.hex);
        }
      })
      .catch((error) => {
        console.error('Error extracting color:', error);
        // Keep default color on error
        setGlowColor('#947CF2');
      });

    return () => {
      fac.destroy();
    };
  }, [video.thumbnailUrl, imageLoaded]);

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

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
      className="group cursor-pointer flex flex-col relative"
      onMouseEnter={() => setHoveredVideo(video.id)}
      onMouseLeave={() => setHoveredVideo(null)}
    >
      {/* Ambient Mode Container - wraps entire card with background tint (static, no scaling) */}
      <div
        className="rounded-xl transition-colors duration-300 p-3 hover:z-20 relative"
        style={{
          backgroundColor: isHovered ? hexToRgba(glowColor, 0.32) : 'transparent',
        }}
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
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-semibold z-20">
            {formatDuration(video.duration)}
          </div>
        )}
        
        {/* Overlays Container - Top Right Corner */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-2 z-30">
          {/* Labels Container - Horizontal layout when multiple labels exist */}
          {(video.isLive || video.type === 'subscription' || (video.type === 'paid' && video.price !== undefined)) && (
            <div className="flex items-center gap-2">
              {/* Price/Subscription Label - Left side when LIVE exists */}
              {video.type === 'subscription' && (
                <div className={`${
                  hasAccess 
                    ? 'bg-green-600/90' // Purchased/Owned - Green success color
                    : 'bg-black/80' // Subscription required - Dark/black background (same as price label)
                } backdrop-blur-sm text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold`}>
                  <Crown className="h-3 w-3" />
                  <span>{hasAccess ? 'Purchased' : 'Subscription'}</span>
                </div>
              )}
              
              {video.type === 'paid' && video.price !== undefined && (
                <div className="bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
                  <Lock className="h-3 w-3" />
                  <span>
                    {video.price.toLocaleString()} {video.currency || 'UZS'}
                  </span>
                </div>
              )}
              
              {/* LIVE Label - Right side (always last) */}
              {video.isLive && (
                <div className="bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
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
              className="bg-black/60 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/80 transition-all duration-200"
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
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/70">
              <span className="line-clamp-1">{video.user?.name || 'Unknown Creator'}</span>
              <span>•</span>
              {video.isLive ? (
                <span className="text-white font-semibold">
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
          <div className="flex-shrink-0 relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1 bg-surface border border-surface rounded-lg shadow-lg py-1 min-w-[180px] z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    // TODO: Implement save to playlist
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                >
                  Save to playlist
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    // TODO: Implement share
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
                >
                  Share
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    // TODO: Implement report
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background transition-colors"
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
