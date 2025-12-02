'use client';

import { useEffect, useRef, useState } from 'react';
import { useMiniplayer } from '@/contexts/MiniplayerContext';
import { Play, Pause, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Miniplayer() {
  const {
    isMiniplayerActive,
    miniplayerVideo,
    miniplayerProgress,
    setMiniplayerProgress,
    closeMiniplayer,
  } = useMiniplayer();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Sync progress when video loads
  useEffect(() => {
    if (videoRef.current && miniplayerVideo && miniplayerProgress > 0) {
      videoRef.current.currentTime = miniplayerProgress;
      setCurrentTime(miniplayerProgress);
    }
  }, [miniplayerVideo, miniplayerProgress]);

  // Update current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setMiniplayerProgress(video.currentTime);
    };
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [setMiniplayerProgress]);

  // Auto-play when miniplayer is activated
  useEffect(() => {
    if (isMiniplayerActive && videoRef.current && miniplayerVideo) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isMiniplayerActive, miniplayerVideo]);

  if (!isMiniplayerActive || !miniplayerVideo) {
    return null;
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if this is a YouTube embed URL
  const isYouTubeEmbed = miniplayerVideo.videoUrl.includes('youtube.com/embed') || 
                        miniplayerVideo.videoUrl.includes('youtu.be');

  const getYouTubeEmbedUrl = (url: string): string => {
    if (url.includes('youtube.com/embed/')) {
      const videoId = url.split('youtube.com/embed/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${Math.floor(miniplayerProgress)}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${Math.floor(miniplayerProgress)}`;
    }
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('youtube.com/watch?v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${Math.floor(miniplayerProgress)}`;
    }
    return url;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-surface border border-surface/50 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-background/50 border-b border-surface/50">
        <Link
          href={`/watch/${miniplayerVideo.id}`}
          className="flex-1 min-w-0 truncate text-sm font-medium text-text-primary hover:text-accent transition-colors"
        >
          {miniplayerVideo.title}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeMiniplayer}
          className="h-6 w-6 text-text-secondary hover:text-text-primary hover:bg-surface/50 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Video Player */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
        {isYouTubeEmbed ? (
          <iframe
            src={getYouTubeEmbedUrl(miniplayerVideo.videoUrl)}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Miniplayer video"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={miniplayerVideo.videoUrl}
              className="w-full h-full object-cover"
              poster={miniplayerVideo.thumbnailUrl}
            />
            
            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group hover:bg-black/40 transition-colors">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20 rounded-full w-12 h-12 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-2 bg-background/50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="h-8 w-8 text-text-secondary hover:text-text-primary hover:bg-surface/50"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>
        {!isYouTubeEmbed && (
          <div className="flex-1 text-xs text-text-secondary font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        )}
      </div>
    </div>
  );
}

