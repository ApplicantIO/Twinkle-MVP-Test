'use client';

import { RefObject } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MoreVertical, LayoutList, LayoutGrid } from 'lucide-react';
import { formatDuration, formatViews, formatTimeAgo, formatExactDate } from '@/lib/utils';
import type { Video } from '@/types';
import type { Playlist } from '@/types';

export type RecommendedTabType = 'recommendations' | 'playlist' | 'creator' | 'topic' | string;

export interface WatchPageRelatedProps {
  video: Video | null;
  relatedVideos: Video[];
  currentPlaylist: Playlist | null;
  urlPlaylistId: string | null;
  listContext: boolean;
  isPlaylistSession: boolean;
  recommendedTab: RecommendedTabType;
  setRecommendedTab: (tab: RecommendedTabType) => void;
  playlistActiveTab: string;
  setPlaylistActiveTab: (tab: string) => void;
  isCardViewActive: boolean;
  setIsCardViewActive: (active: boolean) => void;
  columns: number;
  hoveredVideo: string | null;
  setHoveredVideo: (id: string | null) => void;
  openMenuVideoId: string | null;
  setOpenMenuVideoId: (id: string | null) => void;
  onVideoSwitch: (videoId: string) => void;
  onSaveToPlaylist: (videoId: string, videoTitle: string) => void;
  onShare: (videoId: string, videoTitle: string) => void;
  onReport: (videoId: string, videoTitle: string) => void;
  playlistScrollContainerRef: RefObject<HTMLDivElement | null>;
  activePlaylistVideoRef: RefObject<HTMLDivElement | null>;
  menuRefs: RefObject<Record<string, HTMLDivElement | null>>;
  imageRefs: RefObject<Record<string, HTMLImageElement | null>>;
}

export function WatchPageRelated({
  video,
  relatedVideos,
  currentPlaylist,
  urlPlaylistId,
  listContext,
  isPlaylistSession,
  recommendedTab,
  setRecommendedTab,
  playlistActiveTab,
  setPlaylistActiveTab,
  isCardViewActive,
  setIsCardViewActive,
  columns,
  hoveredVideo,
  setHoveredVideo,
  openMenuVideoId,
  setOpenMenuVideoId,
  onVideoSwitch,
  onSaveToPlaylist,
  onShare,
  onReport,
  playlistScrollContainerRef,
  activePlaylistVideoRef,
  menuRefs,
  imageRefs,
}: WatchPageRelatedProps) {
  // Filter videos based on active tab
  let filteredVideos: Video[] = [];
  if (currentPlaylist && recommendedTab === 'playlist') {
    const videoMap = new Map(relatedVideos.map((v) => [v.id, v]));
    if (isPlaylistSession && video) {
      videoMap.set(video.id, video);
    }
    if (playlistActiveTab === 'all') {
      filteredVideos = currentPlaylist.allVideoIds
        .map((id) => videoMap.get(id))
        .filter((v): v is Video => v !== undefined);
    } else {
      const section = currentPlaylist.sections.find((s) => s.id === playlistActiveTab);
      if (section) {
        filteredVideos = section.videoIds
          .map((id) => videoMap.get(id))
          .filter((v): v is Video => v !== undefined);
      }
    }
  } else if (recommendedTab === 'recommendations') {
    if (listContext && currentPlaylist) {
      const videoMap = new Map(relatedVideos.map((v) => [v.id, v]));
      filteredVideos = currentPlaylist.allVideoIds
        .map((id) => videoMap.get(id))
        .filter((v): v is Video => v !== undefined && v.id !== video?.id);
    } else {
      filteredVideos = relatedVideos.filter((v) => v.id !== video?.id).slice(0, 10);
    }
  } else if (recommendedTab === 'playlist' && !listContext) {
    if (currentPlaylist) {
      const videoMap = new Map(relatedVideos.map((v) => [v.id, v]));
      filteredVideos = currentPlaylist.allVideoIds
        .map((id) => videoMap.get(id))
        .filter((v): v is Video => v !== undefined && v.id !== video?.id);
    } else {
      filteredVideos = relatedVideos
        .filter((v) => v.id !== video?.id && v.category === video?.category)
        .slice(0, 8);
    }
  } else if (recommendedTab === 'creator') {
    filteredVideos = relatedVideos
      .filter((v) => v.id !== video?.id && v.userId === video?.userId)
      .slice(0, 8);
  } else if (recommendedTab === 'topic') {
    filteredVideos = relatedVideos
      .filter((v) => v.id !== video?.id && v.category === video?.category)
      .slice(0, 8);
  }
  if (filteredVideos.length === 0) {
    filteredVideos = relatedVideos.filter((v) => v.id !== video?.id).slice(0, 10);
  }

  const tabTransition = {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
  };

  return (
    <div className="mt-6 w-full max-w-full">
      {currentPlaylist && (
        <div className="mb-4">
          <Link
            href={`/playlist/${currentPlaylist.id}`}
            className="text-sm text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1"
          >
            <span>From: {currentPlaylist.title}</span>
          </Link>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-[#0A0A0A] pt-2 pb-1 -mt-2">
        <div className="flex items-center justify-between gap-4 border-b border-surface/50 w-full">
          <div className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-hide relative">
            {urlPlaylistId && currentPlaylist ? (
              <>
                <button
                  onClick={() => {
                    setRecommendedTab('playlist');
                    setPlaylistActiveTab('all');
                  }}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                    recommendedTab === 'playlist' && playlistActiveTab === 'all'
                      ? 'text-text-primary font-semibold'
                      : 'text-text-secondary/70 hover:text-text-primary'
                  }`}
                >
                  All
                  {recommendedTab === 'playlist' && playlistActiveTab === 'all' && (
                    <motion.div
                      layoutId="activeRecommendationTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-500 rounded-full"
                      transition={tabTransition}
                    />
                  )}
                </button>
                {currentPlaylist.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setRecommendedTab('playlist');
                      setPlaylistActiveTab(section.id);
                    }}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                      recommendedTab === 'playlist' && playlistActiveTab === section.id
                        ? 'text-text-primary font-semibold'
                        : 'text-text-secondary/70 hover:text-text-primary'
                    }`}
                  >
                    {section.title}
                    {recommendedTab === 'playlist' && playlistActiveTab === section.id && (
                      <motion.div
                        layoutId="activeRecommendationTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-500 rounded-full"
                        transition={tabTransition}
                      />
                    )}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  onClick={() => setRecommendedTab('recommendations')}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                    recommendedTab === 'recommendations'
                      ? 'text-text-primary font-semibold'
                      : 'text-text-secondary/70 hover:text-text-primary'
                  }`}
                >
                  Recommended
                  {recommendedTab === 'recommendations' && (
                    <motion.div
                      layoutId="activeRecommendationTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-500 rounded-full"
                      transition={tabTransition}
                    />
                  )}
                </button>
                {currentPlaylist && !listContext && (
                  <button
                    onClick={() => {
                      setRecommendedTab('playlist');
                      setPlaylistActiveTab('all');
                    }}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                      recommendedTab === 'playlist'
                        ? 'text-text-primary font-semibold'
                        : 'text-text-secondary/70 hover:text-text-primary'
                    }`}
                    title={currentPlaylist.title}
                  >
                    From Playlist
                    {recommendedTab === 'playlist' && (
                      <motion.div
                        layoutId="activeRecommendationTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-500 rounded-full"
                        transition={tabTransition}
                      />
                    )}
                  </button>
                )}
                <button
                  onClick={() => setRecommendedTab('creator')}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                    recommendedTab === 'creator'
                      ? 'text-text-primary font-semibold'
                      : 'text-text-secondary/70 hover:text-text-primary'
                  }`}
                >
                  {video?.user?.name || 'Creator'}
                  {recommendedTab === 'creator' && (
                    <motion.div
                      layoutId="activeRecommendationTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-500 rounded-full"
                      transition={tabTransition}
                    />
                  )}
                </button>
                <button
                  onClick={() => setRecommendedTab('topic')}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                    recommendedTab === 'topic'
                      ? 'text-text-primary font-semibold'
                      : 'text-text-secondary/70 hover:text-text-primary'
                  }`}
                >
                  Topic Related
                  {recommendedTab === 'topic' && (
                    <motion.div
                      layoutId="activeRecommendationTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-500 rounded-full"
                      transition={tabTransition}
                    />
                  )}
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => setIsCardViewActive(!isCardViewActive)}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-surface/50 text-text-secondary hover:text-text-primary transition-colors"
            aria-label={isCardViewActive ? 'Switch to list view' : 'Switch to grid view'}
          >
            {isCardViewActive ? (
              <LayoutList className="h-5 w-5" />
            ) : (
              <LayoutGrid className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className="w-full max-w-full">
        {isCardViewActive ? (
          <div
            ref={isPlaylistSession && recommendedTab === 'playlist' ? playlistScrollContainerRef : null}
            className={
              isPlaylistSession && recommendedTab === 'playlist'
                ? 'grid gap-x-0 gap-y-0 overflow-y-auto'
                : 'grid gap-x-0 gap-y-0'
            }
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {filteredVideos.map((relatedVideo) => {
              const isHovered = hoveredVideo === relatedVideo.id;
              const isMenuOpen = openMenuVideoId === relatedVideo.id;
              const isCurrentlyPlaying = video?.id === relatedVideo.id;
              const isPlaylistSessionVideo = isPlaylistSession && recommendedTab === 'playlist';

              const videoItemContent = (
                <>
                  <div
                    className={`rounded-xl transition-all duration-200 p-3 relative ${isMenuOpen ? 'z-[10]' : ''} ${
                      isCurrentlyPlaying ? 'bg-white/10' : isHovered ? 'bg-white/10' : 'bg-transparent'
                    }`}
                  >
                    <div className="relative w-full aspect-video bg-surface rounded-lg overflow-hidden mb-3">
                      {relatedVideo.thumbnailUrl ? (
                        <img
                          src={relatedVideo.thumbnailUrl}
                          alt={relatedVideo.title}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface">
                          <span className="text-text-secondary text-xs">No thumbnail</span>
                        </div>
                      )}
                      {!relatedVideo.isLive && relatedVideo.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-semibold z-[5]">
                          {formatDuration(relatedVideo.duration)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-3 mt-3">
                      <div className="flex-shrink-0 relative">
                        {relatedVideo.user?.profileImageUrl ? (
                          <img
                            src={relatedVideo.user.profileImageUrl}
                            alt={relatedVideo.user.name || 'Creator'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 relative">
                        <h3 className="font-medium text-sm text-text-primary line-clamp-3 mb-1 leading-5">
                          {relatedVideo.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/70">
                          <span className="line-clamp-1">{relatedVideo.user?.name || 'Unknown Creator'}</span>
                          <span>•</span>
                          {relatedVideo.isLive ? (
                            <span className="text-white font-semibold">
                              {relatedVideo.liveViewers
                                ? `${formatViews(relatedVideo.liveViewers)} watching`
                                : 'Live'}
                            </span>
                          ) : (
                            <>
                              <span>{formatViews(relatedVideo.views)} views</span>
                              <span>•</span>
                              <span
                                className="cursor-help"
                                title={formatExactDate(relatedVideo.createdAt)}
                              >
                                {formatTimeAgo(relatedVideo.createdAt)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`flex-shrink-0 relative ${isMenuOpen ? 'z-[10]' : ''}`}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuVideoId(isMenuOpen ? null : relatedVideo.id);
                          }}
                          className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                          aria-label="More options"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {isMenuOpen && (
                          <div
                            ref={(el) => {
                              if (menuRefs.current) menuRefs.current[relatedVideo.id] = el;
                            }}
                            className="absolute right-0 top-full mt-1 bg-surface border border-surface rounded-lg shadow-lg py-1 min-w-[180px] z-[10]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSaveToPlaylist(relatedVideo.id, relatedVideo.title);
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
                                onShare(relatedVideo.id, relatedVideo.title);
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
                                onReport(relatedVideo.id, relatedVideo.title);
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
                  </div>
                </>
              );

              return isPlaylistSessionVideo ? (
                <div
                  key={relatedVideo.id}
                  ref={isCurrentlyPlaying ? activePlaylistVideoRef : null}
                  onClick={() => onVideoSwitch(relatedVideo.id)}
                  className={`group cursor-pointer flex flex-col relative w-full ${isMenuOpen ? 'z-[10]' : ''}`}
                  onMouseEnter={() => setHoveredVideo(relatedVideo.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                >
                  {videoItemContent}
                </div>
              ) : (
                <Link
                  key={relatedVideo.id}
                  href={`/watch/${relatedVideo.id}${listContext && currentPlaylist ? `?playlistId=${currentPlaylist.id}&listContext=true` : ''}`}
                  className={`group cursor-pointer flex flex-col relative ${isMenuOpen ? 'z-[10]' : ''}`}
                  onMouseEnter={() => setHoveredVideo(relatedVideo.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                >
                  {videoItemContent}
                </Link>
              );
            })}
          </div>
        ) : (
          <div
            ref={isPlaylistSession && recommendedTab === 'playlist' ? playlistScrollContainerRef : null}
            className={
              isPlaylistSession && recommendedTab === 'playlist'
                ? 'space-y-0 overflow-y-auto'
                : 'space-y-0'
            }
          >
            {filteredVideos.map((relatedVideo) => {
              const isMenuOpen = openMenuVideoId === relatedVideo.id;
              const isCurrentlyPlaying = video?.id === relatedVideo.id;
              const isPlaylistSessionVideo = isPlaylistSession && recommendedTab === 'playlist';

              const videoItemContent = (
                <>
                  <div className="flex-shrink-0 relative w-40 md:w-64 lg:w-72 aspect-video rounded-lg overflow-hidden bg-surface">
                    {relatedVideo.thumbnailUrl ? (
                      <img
                        ref={(el) => {
                          if (imageRefs.current) imageRefs.current[relatedVideo.id] = el;
                        }}
                        src={relatedVideo.thumbnailUrl}
                        alt={relatedVideo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface">
                        <span className="text-text-secondary text-xs">No thumbnail</span>
                      </div>
                    )}
                    {!relatedVideo.isLive && relatedVideo.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                        {formatDuration(relatedVideo.duration)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <h4 className="text-base font-medium text-text-primary line-clamp-3 group-hover:text-white transition-colors leading-snug">
                        {relatedVideo.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                        <span>{relatedVideo.user?.name || 'Unknown Creator'}</span>
                        {relatedVideo.isLive ? (
                          <span className="text-white font-semibold">
                            {relatedVideo.liveViewers
                              ? `${formatViews(relatedVideo.liveViewers)} watching`
                              : 'Live'}
                          </span>
                        ) : (
                          <>
                            <span>•</span>
                            <span>{formatViews(relatedVideo.views)} views</span>
                            <span>•</span>
                            <span
                              className="underline decoration-dotted underline-offset-2 cursor-help"
                              title={formatExactDate(relatedVideo.createdAt)}
                            >
                              {formatTimeAgo(relatedVideo.createdAt)}
                            </span>
                          </>
                        )}
                      </div>
                      {relatedVideo.description && (
                        <p className="text-zinc-400 text-xs line-clamp-2 mt-1">
                          {relatedVideo.description}
                        </p>
                      )}
                    </div>
                    <div className={`flex-shrink-0 relative ${isMenuOpen ? 'z-[10]' : ''}`}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenuVideoId(isMenuOpen ? null : relatedVideo.id);
                        }}
                        className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {isMenuOpen && (
                        <div
                          ref={(el) => {
                            if (menuRefs.current) menuRefs.current[relatedVideo.id] = el;
                          }}
                          className="absolute right-0 top-full mt-1 bg-surface border border-surface rounded-lg shadow-lg py-1 min-w-[180px] z-[10]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onSaveToPlaylist(relatedVideo.id, relatedVideo.title);
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
                              onShare(relatedVideo.id, relatedVideo.title);
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
                              onReport(relatedVideo.id, relatedVideo.title);
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
                </>
              );

              return isPlaylistSessionVideo ? (
                <div
                  key={relatedVideo.id}
                  ref={isCurrentlyPlaying ? activePlaylistVideoRef : null}
                  onClick={() => onVideoSwitch(relatedVideo.id)}
                  className={`flex gap-4 rounded-lg p-3 transition-all duration-200 group relative w-full cursor-pointer ${
                    isCurrentlyPlaying
                      ? 'bg-white/10'
                      : hoveredVideo === relatedVideo.id
                        ? 'bg-white/10'
                        : 'bg-transparent'
                  }`}
                  onMouseEnter={() => setHoveredVideo(relatedVideo.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                >
                  {videoItemContent}
                </div>
              ) : (
                <Link
                  key={relatedVideo.id}
                  href={`/watch/${relatedVideo.id}${listContext && currentPlaylist ? `?playlistId=${currentPlaylist.id}&listContext=true` : ''}`}
                  className={`flex gap-4 rounded-lg p-3 transition-colors duration-200 group relative ${
                    hoveredVideo === relatedVideo.id ? 'bg-white/10' : 'bg-transparent'
                  }`}
                  onMouseEnter={() => setHoveredVideo(relatedVideo.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                >
                  {videoItemContent}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
