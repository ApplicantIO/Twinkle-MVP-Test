'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  SkipForward, 
  SkipBack, 
  Settings,
  Minimize2,
  ArrowLeft,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Video } from '@/types';
import { useMiniplayer } from '@/contexts/MiniplayerContext';

interface VideoPlayerProps {
  videoUrl: string;
  autoPlay?: boolean;
  thumbnailUrl?: string;
  video?: Video;
  onProgressUpdate?: (progress: number) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function VideoPlayer({
  videoUrl,
  autoPlay = false,
  thumbnailUrl,
  video,
  onProgressUpdate,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
}: VideoPlayerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);

  // Context
  const { isMiniplayerActive, setIsMiniplayerActive, activateMiniplayer, miniplayerProgress, closeMiniplayer } = useMiniplayer();
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if we're on the watch page
  const isOnWatchPage = pathname?.startsWith('/watch/') || false;

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showMiniplayerControls, setShowMiniplayerControls] = useState(false); // Miniplayer hover state
  
  // Progress bar hover preview state
  const [showPreview, setShowPreview] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPosition, setHoverPosition] = useState(0); // Percentage position for preview
  const progressBarContainerRef = useRef<HTMLDivElement>(null);
  
  // Draggable miniplayer state
  const [miniPlayerPosition, setMiniPlayerPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const miniPlayerPositionRef = useRef({ x: 0, y: 0 });
  const dragDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For hold-to-drag
  const isMouseDownRef = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    miniPlayerPositionRef.current = miniPlayerPosition;
  }, [miniPlayerPosition]);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSetting, setActiveSetting] = useState<'main' | 'quality' | 'speed' | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoQuality, setVideoQuality] = useState('Auto');
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);

  // Check if YouTube embed
  const isYouTubeEmbed = useMemo(
    () => videoUrl.includes('youtube.com/embed') || videoUrl.includes('youtu.be'),
    [videoUrl]
  );
  
  // Format time helper
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if video is live
  const isLive = video?.isLive === true;

  // Handle progress bar hover preview (only for non-live videos)
  const handleProgressBarMouseMove = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    if (isLive) return; // Don't show preview for live videos
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    
    const time = percentage * duration;
    setHoverTime(time);
    setHoverPosition(percentage * 100);
    setShowPreview(true);
  }, [duration, isLive]);

  const handleProgressBarMouseLeave = useCallback(() => {
    setShowPreview(false);
    setHoverTime(0);
    setHoverPosition(0);
  }, []);

  // Robust toggle play/pause function
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      console.error('Video element not found');
      return;
    }

    // Check if video is ready to play
    if (video.readyState === 0) {
      console.warn('Video not loaded yet, waiting for metadata...');
      video.addEventListener('loadedmetadata', () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              // Silently handle autoplay restrictions and unsupported operations
              if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
                console.warn('Video play not allowed or not supported:', error.name);
              } else {
                console.error('Video play error:', error);
              }
            });
        }
      }, { once: true });
      return;
    }

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            // Silently handle autoplay restrictions and unsupported operations
            if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
              console.warn('Video play not allowed or not supported:', error.name);
            } else {
              console.error('Video play error:', error);
            }
          });
    }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      onProgressUpdate?.(time);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Set initial volume
    video.volume = volume;
    video.muted = isMuted;

    // Restore progress if in miniplayer mode
    if (isMiniplayerActive && miniplayerProgress > 0) {
      const restoreProgress = () => {
        if (video.readyState >= 2) {
          video.currentTime = miniplayerProgress;
          setCurrentTime(miniplayerProgress);
        } else {
          video.addEventListener('loadedmetadata', restoreProgress, { once: true });
        }
      };
      restoreProgress();
    }

    // Handle autoplay - only if video is ready
    if (autoPlay) {
      // Wait for video to be ready before attempting autoplay
      const attemptAutoplay = () => {
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          // Restore progress if in miniplayer mode (before playing)
          if (isMiniplayerActive && miniplayerProgress > 0) {
            video.currentTime = miniplayerProgress;
            setCurrentTime(miniplayerProgress);
          }
          
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              // Silently handle autoplay restrictions and unsupported operations
              if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
                // These are expected and don't need to be logged as errors
                return;
              }
              console.error('Autoplay failed:', error);
            });
          }
        } else {
          // Video not ready yet, wait for loadedmetadata
          video.addEventListener('loadedmetadata', attemptAutoplay, { once: true });
        }
      };
      
      attemptAutoplay();
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [autoPlay, volume, isMuted, onProgressUpdate, isMiniplayerActive, miniplayerProgress]);

  // Update playback speed
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    // Check actual fullscreen state from DOM
    const isCurrentlyFullscreen = !!document.fullscreenElement;

    if (!isCurrentlyFullscreen) {
      // Enter fullscreen
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error('Error entering fullscreen:', err);
        });
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error('Error exiting fullscreen:', err);
        });
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Skip if YouTube embed or typing
      if (isYouTubeEmbed || isTyping) {
        return;
      }

      // Ignore if settings menu is open (except Escape)
      if (showSettings) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowSettings(false);
        }
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      // Spacebar or K: Toggle Play/Pause
      if (e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (e.key === ' ') {
          e.stopPropagation();
        }
        togglePlay();
        return;
      }

      // F: Toggle Fullscreen
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      // M: Toggle Mute
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
        return;
      }

      // Arrow Left: Seek backward 5s
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        return;
      }

      // Arrow Right: Seek forward 5s
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        video.currentTime = Math.min(duration, video.currentTime + 5);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isYouTubeEmbed, showSettings, duration, togglePlay, toggleFullscreen]);

  // Controls fade out on inactivity (Fullscreen only)
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Always show controls when paused
    if (!isPlaying) {
      setShowControls(true);
      return;
    }
    
    // Only auto-hide in fullscreen mode when playing
    if (isFullscreen && isPlaying) {
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
        // Only hide if still playing (don't hide if paused during timeout)
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
    } else {
      // Always show controls when not in fullscreen
      setShowControls(true);
    }
  }, [isFullscreen, isPlaying]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // Show controls when video is paused (fullscreen only)
  useEffect(() => {
    if (!isPlaying && isFullscreen) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [isPlaying, isFullscreen]);

  // Handle mouse movement - only auto-hide in fullscreen
  const handleMouseMove = () => {
    // Only reset timer in fullscreen mode
    if (isFullscreen) {
      resetControlsTimeout();
    }
  };

  // Handle video click (toggle play/pause) - only when not clicking controls
  const handleVideoClick = (e: React.MouseEvent) => {
    // Don't toggle if we just finished dragging
    if (isDragging) return;
    
    const target = e.target as HTMLElement;
    // Don't toggle if clicking on controls or buttons
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('[role="button"]') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT'
    ) {
      return;
    }
    togglePlay();
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Disable seeking for live videos
    if (isLive) {
      e.preventDefault();
      return;
    }
    
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // For live videos, ensure progress bar is always at the end
  const effectiveDuration = isLive ? (duration || 100) : duration;
  const effectiveCurrentTime = isLive ? effectiveDuration : currentTime;

  // Toggle mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
  };

  // Handle minimize (Miniplayer) - activate miniplayer and navigate back
  const handleMinimize = useCallback(() => {
    if (video && videoRef.current && isOnWatchPage) {
      // Capture current video state
      const currentTime = videoRef.current.currentTime;
      
      // Step 1: Activate miniplayer with current video and progress
      activateMiniplayer(video, currentTime);
      
      // Step 2: Navigate back to previous page immediately
      router.back();
    }
  }, [video, isOnWatchPage, activateMiniplayer, router]);

  // Skip forward/backward
  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(duration, video.currentTime + 15);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 15);
  };

  // Settings options
  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const qualityOptions = ['Auto', '1080p', '720p', '480p', '360p'];

  // Settings menu ref for outside click detection
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button[title="Settings"]')
      ) {
        setShowSettings(false);
        setActiveSetting(null);
      }
    };

    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // Determine positioning based on route and miniplayer state
  const isInMiniplayerMode = isMiniplayerActive && !isOnWatchPage;

  // Initialize miniplayer position to bottom-right (default) when entering miniplayer mode
  useEffect(() => {
    if (isInMiniplayerMode) {
      // Reset position to default bottom-right when entering miniplayer mode
      // w-96 = 384px, h-56 = 224px, bottom-4 = 16px, right-4 = 16px
      const defaultX = typeof window !== 'undefined' ? window.innerWidth - 384 - 16 : 0;
      const defaultY = typeof window !== 'undefined' ? window.innerHeight - 224 - 16 : 0;
      setMiniPlayerPosition({ x: defaultX, y: defaultY });
    }
  }, [isInMiniplayerMode]);

  // Handle drag start with hold-to-drag delay (YouTube-style)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isInMiniplayerMode) return;
    
    // Prevent drag if clicking on any interactive element
    const target = e.target as HTMLElement;
    
    // Check if target is an interactive element - if so, don't start drag
    const isInteractiveElement = 
      target.closest('button') || 
      target.closest('input') || 
      target.closest('[role="button"]') ||
      target.closest('.controls-overlay') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      (target instanceof HTMLInputElement && target.type === 'range') || // Progress bar
      target.closest('input[type="range"]') || // Progress bar container
      target.closest('[class*="pointer-events-auto"]') || // Any element with pointer-events-auto
      target.closest('[style*="pointer-events: auto"]'); // Inline style with pointer-events
    
    if (isInteractiveElement) {
      return; // Don't start drag - let the element handle the click
    }
    
    // Only allow drag if clicking directly on video element
    if (target.tagName !== 'VIDEO' && !target.closest('video')) {
      return; // Not video element, don't drag
    }
    
    isMouseDownRef.current = true;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  
    // Wait 150ms before enabling drag (hold-to-drag like YouTube)
    dragDelayTimeoutRef.current = setTimeout(() => {
      if (isMouseDownRef.current) {
        setIsDragging(true);
        dragOffset.current = { 
          x: miniPlayerPositionRef.current.x, 
          y: miniPlayerPositionRef.current.y 
        };
      }
    }, 150);
  }, [isInMiniplayerMode]);

  // Handle mouse up - cancel drag
  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
    if (dragDelayTimeoutRef.current) {
      clearTimeout(dragDelayTimeoutRef.current);
      dragDelayTimeoutRef.current = null;
    }
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  // Handle drag move with magnetic snap to edges
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      // Calculate new position
      let newX = dragOffset.current.x + deltaX;
      let newY = dragOffset.current.y + deltaY;

      // Boundary constraints - keep player within viewport
      const playerWidth = 384; // w-96 = 384px
      const playerHeight = 224; // h-56 = 224px
      const padding = 16; // 4 * 4px = 16px
      const snapThreshold = 50; // Distance threshold for magnetic snap

      // Clamp to viewport boundaries
      newX = Math.max(padding, Math.min(newX, window.innerWidth - playerWidth - padding));
      newY = Math.max(padding, Math.min(newY, window.innerHeight - playerHeight - padding));

      // Magnetic snap to left or right edge (YouTube-style)
      const distanceToLeft = newX - padding;
      const distanceToRight = (window.innerWidth - playerWidth - padding) - newX;

      if (distanceToLeft < snapThreshold) {
        newX = padding; // Snap to left
      } else if (distanceToRight < snapThreshold) {
        newX = window.innerWidth - playerWidth - padding; // Snap to right
      }

      setMiniPlayerPosition({ x: newX, y: newY });
    };

    const handleMouseUpGlobal = () => {
      setIsDragging(false);
      isMouseDownRef.current = false;
      if (dragDelayTimeoutRef.current) {
        clearTimeout(dragDelayTimeoutRef.current);
        dragDelayTimeoutRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUpGlobal);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
      if (dragDelayTimeoutRef.current) {
        clearTimeout(dragDelayTimeoutRef.current);
      }
    };
  }, [isDragging]);

  // Handle maximize/restore - navigate to watch page
  const handleMaximize = useCallback(() => {
    if (video?.id && isInMiniplayerMode) {
      // Navigate to watch page - miniplayer state will be cleared by watch page
      router.push(`/watch/${video.id}`);
  }
  }, [video, isInMiniplayerMode, router]);

  return (
    <div
      ref={containerRef}
      className={`bg-black group ${
        isInMiniplayerMode
          ? 'fixed w-96 h-56 z-50 rounded-xl overflow-hidden shadow-2xl'
          : isFullscreen
          ? 'relative rounded-none'
          : 'relative w-full rounded-xl overflow-hidden'
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      style={
        isInMiniplayerMode
          ? {
              left: `${miniPlayerPosition.x}px`,
              top: `${miniPlayerPosition.y}px`,
            }
          : undefined
      }
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        // Show miniplayer controls on hover
        if (isInMiniplayerMode) {
          setShowMiniplayerControls(true);
        }
        // Only hide controls on mouse leave in fullscreen mode
        if (isFullscreen && isPlaying) {
        resetControlsTimeout();
        }
      }}
      onMouseLeave={() => {
        // Hide miniplayer controls on mouse leave
        if (isInMiniplayerMode) {
          setShowMiniplayerControls(false);
        }
        // Only hide controls on mouse leave in fullscreen mode
        if (isFullscreen && isPlaying) {
          resetControlsTimeout();
        }
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className={`w-full ${
          isInMiniplayerMode 
            ? `h-full object-cover ${isDragging ? 'cursor-grabbing' : 'cursor-default'}` 
            : isFullscreen 
            ? 'h-full object-contain' 
            : 'aspect-video'
        }`}
        poster={thumbnailUrl}
        onClick={handleVideoClick}
      />
      
      {/* Controls Overlay */}
      {isInMiniplayerMode ? (
        /* Miniplayer Mode - Simplified UI with Hover Controls */
        <>
          {/* Always Visible: Thin Progress Bar at Bottom (below timing) - Always clickable */}
          <div 
            ref={progressBarContainerRef}
            className="absolute bottom-0 left-0 right-0 z-[60]" 
            style={{ paddingBottom: '4px' }}
            onMouseLeave={handleProgressBarMouseLeave}
          >
            {/* Progress Bar Hover Preview (for non-live videos only) */}
            {showPreview && !isLive && (
              <div
                className="absolute bottom-full mb-2 pointer-events-none z-50"
                style={{ left: `${hoverPosition}%`, transform: 'translateX(-50%)' }}
              >
                {/* Preview Tooltip */}
                <div className="bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap mb-1">
                  {formatTime(hoverTime)}
                </div>
                {/* Preview Thumbnail (Mock) */}
                <div className="w-32 h-18 bg-surface border border-surface rounded overflow-hidden">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                      {formatTime(hoverTime)}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <input
              ref={progressBarRef}
              type="range"
              min="0"
              max={effectiveDuration || 0}
              value={effectiveCurrentTime}
              onChange={handleSeek}
              onInput={handleSeek} // Also handle onInput for better compatibility
              disabled={isLive}
              className={`miniplayer-progress-bar w-full appearance-none transition-all ${
                isLive ? 'cursor-default' : 'cursor-pointer'
              } ${showMiniplayerControls ? 'h-1' : 'h-0.5'} ${
                isLive ? 'accent-red-600' : 'accent-white'
              }`}
              style={{
                background: isLive
                  ? `linear-gradient(to right, rgb(220 38 38) 0%, rgb(220 38 38) 100%)`
                  : `linear-gradient(to right, white 0%, white ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`,
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => {
                e.stopPropagation(); // Stop drag handler from interfering
                if (isLive) {
                  e.preventDefault();
                }
                // Don't preventDefault for non-live - allow native range input behavior
              }}
              onMouseUp={(e) => e.stopPropagation()}
              onMouseMove={handleProgressBarMouseMove}
              onMouseEnter={() => !isLive && setShowPreview(true)}
            />
          </div>

          {/* Hover-Only Controls Overlay - Visual only, doesn't block clicks */}
      <div
            className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 pointer-events-none ${
              showMiniplayerControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
            {/* Miniplayer Header - Visual Background Only */}
            <div className="miniplayer-header absolute top-0 left-0 right-0 px-3 py-2 z-30 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
              {/* Left Group: Metadata (Title and Channel) - Stacked Vertically */}
              <div className="flex flex-col flex-grow min-w-0 pr-2 max-w-[calc(100%-80px)]">
                {video?.title && (
                  <h3 className="text-white text-sm font-medium truncate drop-shadow-lg leading-tight">
                    {video.title}
                  </h3>
                )}
                {video?.user?.name && (
                  <p className="text-white/80 text-xs truncate drop-shadow-lg leading-tight mt-0.5">
                    {video.user.name}
                  </p>
                )}
              </div>
            </div>
                      
            {/* Center: Play/Pause Button - Has pointer-events */}
            <div 
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePlay();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="text-white hover:bg-white/30 rounded-full w-14 h-14 bg-black/50 transition-opacity z-50 relative"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="h-7 w-7" fill="currentColor" strokeWidth={0} />
                ) : (
                  <Play className="h-7 w-7 ml-1" fill="currentColor" strokeWidth={0} />
                )}
              </Button>
            </div>

            {/* Bottom Bar - Timing/LIVE Badge (always above progress bar, only visible on hover) */}
            <div className="absolute bottom-0 left-0 right-0 px-3 z-30 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" style={{ paddingBottom: '40px' }}>
              {/* Timing or LIVE Badge - Left aligned like YouTube */}
              <div className="flex items-center justify-start">
                {isLive ? (
                  <div className="bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <span>LIVE</span>
                  </div>
                ) : (
                  <span className="text-white text-xs font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                )}
              </div>
            </div>
                  </div>
                  
          {/* Interactive Header Buttons Layer - Separate, Always Clickable (only visible on hover) */}
          <div 
            className={`absolute top-0 right-0 px-3 py-2 z-50 pointer-events-auto flex items-center gap-2 transition-opacity duration-300 ${
              showMiniplayerControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Expand/Restore Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMaximize();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="text-white hover:bg-white/20 rounded-full p-1.5 h-7 w-7"
              title="Expand to Full View"
            >
              <Maximize className="h-4 w-4" />
            </Button>
            
            {/* Close (X) Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (videoRef.current) {
                  videoRef.current.pause();
                  videoRef.current.currentTime = 0;
                }
                closeMiniplayer();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="text-white hover:bg-white/20 rounded-full p-1.5 h-7 w-7"
              title="Close Miniplayer"
            >
              <X className="h-4 w-4" />
            </Button>
                    </div>
        </>
      ) : (
        /* Normal/Fullscreen Mode - Full Controls */
        (() => {
          const controlsVisible = isFullscreen ? showControls : true;
          return (
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
                controlsVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Top-Left: Video Title (Fullscreen Only) */}
              {isFullscreen && video?.title && (
                <div className="absolute top-3 left-3 z-10">
                  <h2 className="text-white text-xl font-semibold drop-shadow-lg">
                    {video.title}
                  </h2>
                </div>
              )}

              {/* Bottom Control Bar - Compact, minimal padding */}
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-1 z-0">
                {/* Progress Bar - Positioned above button row with hover preview */}
                <div 
                  ref={progressBarContainerRef}
                  className="relative mb-1.5"
                  onMouseLeave={handleProgressBarMouseLeave}
                >
                  {/* Progress Bar Hover Preview (for non-live videos only) */}
                  {showPreview && !isLive && (
                    <div
                      className="absolute bottom-full mb-2 pointer-events-none z-50"
                      style={{ left: `${hoverPosition}%`, transform: 'translateX(-50%)' }}
                    >
                      {/* Preview Tooltip */}
                      <div className="bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap mb-1">
                        {formatTime(hoverTime)}
                      </div>
                      {/* Preview Thumbnail (Mock) */}
                      <div className="w-32 h-18 bg-surface border border-surface rounded overflow-hidden">
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                            {formatTime(hoverTime)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <input
                    ref={progressBarRef}
                    type="range"
                    min="0"
                    max={effectiveDuration || 0}
                    value={effectiveCurrentTime}
                    onChange={handleSeek}
                    disabled={isLive}
                    className={`w-full h-1 rounded-none appearance-none mb-0 ${
                      isLive ? 'cursor-default accent-red-600' : 'cursor-pointer accent-white'
                    }`}
                    style={{
                      background: isLive
                        ? `linear-gradient(to right, rgb(220 38 38) 0%, rgb(220 38 38) 100%)`
                        : `linear-gradient(to right, white 0%, white ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`,
                    }}
                    onMouseMove={handleProgressBarMouseMove}
                    onMouseEnter={() => !isLive && setShowPreview(true)}
                  />
                </div>
        
          {/* Main Controls Row - Compact Layout */}
          <div className="flex items-center justify-between">
            {/* Left Group - Reordered: Play/Pause -> Next -> Volume -> Timecode */}
        <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
                className="text-white hover:bg-white/20 rounded-full p-1.5"
                title={isPlaying ? 'Pause' : 'Play'}
            >
                {isPlaying ? (
                  <Pause className="h-5 w-5" fill="currentColor" strokeWidth={0} />
                ) : (
                  <Play className="h-5 w-5" fill="currentColor" strokeWidth={0} />
                )}
          </Button>
          
              {/* Next Button - Hidden in miniplayer mode */}
              {!isInMiniplayerMode && hasNext && onNext && (
            <Button
              variant="ghost"
              size="icon"
                  onClick={onNext}
                  className="text-white hover:bg-white/20 rounded-full p-1.5"
                  title="Next"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
              )}

              {/* Volume Control Group */}
            <div
                className="flex items-center gap-1.5"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                  className="text-white hover:bg-white/20 rounded-full p-1.5"
                  title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              {showVolumeSlider && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
                    className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                  style={{
                      background: `linear-gradient(to right, white 0%, white ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`,
                  }}
            />
              )}
          </div>
          
              {/* Timecode or LIVE Badge - Immediately after Volume */}
              {isLive ? (
                <div className="bg-red-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-semibold ml-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span>LIVE</span>
                </div>
              ) : (
                <span className="text-white text-xs font-medium ml-1 min-w-[4rem]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              )}
          </div>
          
            {/* Right Group - Settings -> Minimize -> Fullscreen (or Close/Maximize in miniplayer) */}
            <div className="flex items-center gap-2">
              {/* Close Button (Miniplayer Mode Only) */}
              {isInMiniplayerMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    // Stop video playback
                    if (videoRef.current) {
                      videoRef.current.pause();
                      videoRef.current.currentTime = 0;
                    }
                    // Close miniplayer and clear state
                    closeMiniplayer();
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-1.5"
                  title="Close Miniplayer"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}

              {/* Settings Menu - Hidden in miniplayer mode */}
              {!isInMiniplayerMode && (
              <div className="relative" ref={settingsMenuRef}>
            <Button
              variant="ghost"
              size="icon"
                  onClick={() => {
                    setShowSettings(!showSettings);
                    if (!showSettings) {
                      setActiveSetting('main');
                    } else {
                      setActiveSetting(null);
                    }
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-1.5"
                  title="Settings"
            >
                  <Settings className="h-5 w-5" />
            </Button>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-surface border border-surface rounded-lg shadow-xl min-w-[200px] z-50">
                    {activeSetting === 'main' && (
                      <>
                        {/* Quality Option */}
                        <button
                          onClick={() => setActiveSetting('quality')}
                          className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-background transition-colors flex items-center justify-between"
                        >
                          <span>Quality</span>
                          <span className="text-xs text-text-secondary">{videoQuality}</span>
                        </button>

                        {/* Speed Option */}
                        <button
                          onClick={() => setActiveSetting('speed')}
                          className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-background transition-colors flex items-center justify-between border-t border-surface/50"
                        >
                          <span>Speed</span>
                          <span className="text-xs text-text-secondary">
                            {playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}
                          </span>
                        </button>

                        {/* Autoplay Toggle */}
                        <div className="px-4 py-2.5 border-t border-surface/50 flex items-center justify-between">
                          <span className="text-sm text-text-primary">Autoplay</span>
                          <button
                            onClick={() => setAutoplayEnabled(!autoplayEnabled)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${
                              autoplayEnabled ? 'bg-accent' : 'bg-background border border-surface'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                autoplayEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </>
                    )}

                    {activeSetting === 'quality' && (
                      <>
                        {/* Back Button */}
                        <button
                          onClick={() => setActiveSetting('main')}
                          className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-background transition-colors flex items-center gap-2 border-b border-surface/50"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span>Back</span>
                        </button>

                        {/* Quality Options */}
                        <div className="py-1">
                          {qualityOptions.map((quality) => (
                            <button
                              key={quality}
                              onClick={() => {
                                setVideoQuality(quality);
                                setActiveSetting('main');
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                videoQuality === quality
                                  ? 'bg-accent text-white'
                                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
                              }`}
                            >
                              {quality}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {activeSetting === 'speed' && (
                      <>
                        {/* Back Button */}
                        <button
                          onClick={() => setActiveSetting('main')}
                          className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-background transition-colors flex items-center gap-2 border-b border-surface/50"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span>Back</span>
                        </button>

                        {/* Speed Options */}
                        <div className="py-1">
                          {speedOptions.map((speed) => (
                            <button
                              key={speed}
                              onClick={() => {
                                setPlaybackSpeed(speed);
                                setActiveSetting('main');
                              }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                playbackSpeed === speed
                                  ? 'bg-accent text-white'
                                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
                              }`}
                            >
                              {speed === 1 ? 'Normal' : `${speed}x`}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Minimize Button (Miniplayer) - Hidden in miniplayer mode */}
              {!isInMiniplayerMode && video && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMinimize}
                  className="text-white hover:bg-white/20 rounded-full p-1.5"
                  title="Minimize to Miniplayer"
                >
                  <Minimize2 className="h-5 w-5" />
                </Button>
              )}

              {/* Maximize/Restore Button (Miniplayer Mode Only) */}
              {isInMiniplayerMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMaximize}
                  className="text-white hover:bg-white/20 rounded-full p-1.5"
                  title="Restore to Full View"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              )}

              {/* Fullscreen Toggle - Hidden in miniplayer mode */}
              {!isInMiniplayerMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
                className="text-white hover:bg-white/20 rounded-full p-1.5"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
          </Button>
              )}
          </div>
        </div>
      </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
