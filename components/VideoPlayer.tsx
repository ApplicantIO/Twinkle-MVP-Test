'use client';

import { useState, useRef, useEffect } from 'react';
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
  PictureInPicture,
  Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  videoUrl: string;
  autoPlay?: boolean;
  thumbnailUrl?: string;
}

export function VideoPlayer({ videoUrl, autoPlay = false, thumbnailUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoQuality, setVideoQuality] = useState('1080p');
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if this is a YouTube embed URL
  const isYouTubeEmbed = videoUrl.includes('youtube.com/embed') || videoUrl.includes('youtu.be');
  
  // Extract YouTube video ID for embed
  const getYouTubeEmbedUrl = (url: string): string => {
    if (url.includes('youtube.com/embed/')) {
      const videoId = url.split('youtube.com/embed/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}${autoPlay ? '?autoplay=1' : ''}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}${autoPlay ? '?autoplay=1' : ''}`;
    }
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('youtube.com/watch?v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}${autoPlay ? '?autoplay=1' : ''}`;
    }
    return url;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    if (autoPlay) {
      video.play().catch(console.error);
    }

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [autoPlay]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 15, duration);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 15, 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const togglePip = async () => {
    if (!videoRef.current) return;
    
    try {
      if (!isPip && videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
        setIsPip(true);
      } else if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPip(false);
      }
    } catch (error) {
      console.error('Picture-in-Picture error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const qualityOptions = ['4K', '1080p', '720p', '480p', '360p', '240p', '144p'];

  // State for YouTube embed loading
  const [showYouTubeEmbed, setShowYouTubeEmbed] = useState(autoPlay);
  
  // If it's a YouTube embed, show thumbnail first, then iframe on play
  if (isYouTubeEmbed) {
    return (
      <div className="relative w-full bg-black rounded-lg overflow-hidden group" style={{ paddingBottom: '56.25%', height: 0 }}>
        {!showYouTubeEmbed && thumbnailUrl ? (
          <div className="absolute inset-0 w-full h-full">
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={() => setShowYouTubeEmbed(true)}>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full w-16 h-16 bg-black/50"
              >
                <Play className="h-8 w-8" />
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            src={getYouTubeEmbedUrl(videoUrl)}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video player"
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => {
        setShowControls(true);
        resetControlsTimeout();
      }}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
          setShowControls(false);
        }
      }}
    >
      {/* Thumbnail placeholder when video is not playing or not loaded */}
      {thumbnailUrl && (!isPlaying || !videoRef.current?.readyState) && (
        <div className="absolute inset-0 w-full aspect-video">
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20 rounded-full w-16 h-16 bg-black/50"
              >
                <Play className="h-8 w-8" />
              </Button>
            </div>
          )}
        </div>
      )}
      
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video"
        onClick={togglePlay}
        poster={thumbnailUrl}
        style={{ display: isPlaying && videoRef.current?.readyState ? 'block' : 'none' }}
      />
      
      {/* Floating Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Controls Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-end">
          <div className="flex items-center gap-2">
            {/* Settings Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <Settings className="h-5 w-5" />
              </Button>
              
              {showSettings && (
                <div className="absolute top-full right-0 mt-2 bg-surface border border-surface rounded-lg shadow-xl min-w-[200px] z-50">
                  {/* Playback Speed */}
                  <div className="p-3 border-b border-surface">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="h-4 w-4 text-text-secondary" />
                      <span className="text-sm font-medium text-text-primary">Playback Speed</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {speedOptions.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => {
                            setPlaybackSpeed(speed);
                            setShowSettings(false);
                          }}
                          className={`px-3 py-1 rounded text-xs ${
                            playbackSpeed === speed
                              ? 'bg-accent text-white'
                              : 'bg-background text-text-secondary hover:bg-surface'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Video Quality */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="h-4 w-4 text-text-secondary" />
                      <span className="text-sm font-medium text-text-primary">Quality</span>
                    </div>
                    <div className="space-y-1">
                      {qualityOptions.map((quality) => (
                        <button
                          key={quality}
                          onClick={() => {
                            setVideoQuality(quality);
                            setShowSettings(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded text-sm ${
                            videoQuality === quality
                              ? 'bg-accent text-white'
                              : 'text-text-secondary hover:bg-background'
                          }`}
                        >
                          {quality}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Progress Bar */}
          <div className="mb-3">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
          style={{
                background: duration > 0 ? `linear-gradient(to right, #7C5FD9 0%, #7C5FD9 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)` : 'rgba(255,255,255,0.2)'
          }}
        />
          </div>
        
          {/* Control Buttons Row */}
        <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20 rounded-full"
            >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          
            {/* Skip Backward */}
            <Button
              variant="ghost"
              size="icon"
              onClick={skipBackward}
              className="text-white hover:bg-white/20 rounded-full"
              title="Rewind 15 seconds"
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            {/* Skip Forward */}
            <Button
              variant="ghost"
              size="icon"
              onClick={skipForward}
              className="text-white hover:bg-white/20 rounded-full"
              title="Forward 15 seconds"
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            {/* Volume Control */}
            <div
              className="flex items-center gap-2"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 rounded-full"
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
                  className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #7C5FD9 0%, #7C5FD9 ${(volume || 0) * 100}%, rgba(255,255,255,0.2) ${(volume || 0) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
            />
              )}
          </div>
          
            {/* Time Display */}
            <div className="flex-1 text-sm text-white font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
            {/* Picture-in-Picture */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePip}
              className="text-white hover:bg-white/20 rounded-full"
              title="Picture-in-Picture"
            >
              <PictureInPicture className="h-5 w-5" />
            </Button>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 rounded-full"
            >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
