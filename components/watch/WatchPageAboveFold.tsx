'use client';

import { RefObject } from 'react';
import Link from 'next/link';
import { User, ThumbsUp, ThumbsDown, Share2, Bookmark, MoreVertical, MessageSquare, Bell, Check, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoDescription from '@/components/VideoDescription';
import { MonetizationCTASection } from '@/components/MonetizationCTASection';
import { WatchPageInlineModals, type WatchPageInlineModalsProps } from './WatchPageInlineModals';
import type { Video } from '@/types';
import type { Playlist } from '@/types';

export interface WatchPageAboveFoldProps {
  video: Video;
  currentPlaylist: Playlist | null;
  hasFullAccess: boolean;
  /** Refs for inline modals and more menu (must be passed from page so click-outside works) */
  shareModalRef: RefObject<HTMLDivElement | null>;
  reportModalRef: RefObject<HTMLDivElement | null>;
  notificationsModalRef: RefObject<HTMLDivElement | null>;
  moreButtonRef: RefObject<HTMLButtonElement | null>;
  moreMenuRef: RefObject<HTMLDivElement | null>;
  commentsSectionRef: RefObject<HTMLDivElement | null>;
  likes: number;
  dislikes: number;
  isLiked: boolean;
  isDisliked: boolean;
  isSubscribed: boolean;
  isSaved: boolean;
  subscribersCount: number;
  notificationState: 'NONE' | 'ALL' | 'PERSONALIZED';
  isAnimating: boolean;
  isShareModalOpen: boolean;
  onShareModalToggle: () => void;
  isMoreMenuOpen: boolean;
  onMoreMenuClick: () => void;
  isNotificationsModalOpen: boolean;
  isMiniplayerActive: boolean;
  onLike: () => void;
  onDislike: () => void;
  onSubscribe: () => void;
  onSave: () => void;
  onOpenComments: () => void;
  onNotificationsClick: () => void;
  onCloseNotifications: () => void;
  onReportClick: () => void;
  inlineModalsProps: WatchPageInlineModalsProps;
  /** Called when user completes purchase (video or playlist); page handles reload/state. */
  onPurchaseComplete: () => void;
}

export function WatchPageAboveFold({
  video,
  currentPlaylist,
  hasFullAccess,
  shareModalRef,
  reportModalRef,
  notificationsModalRef,
  moreButtonRef,
  moreMenuRef,
  commentsSectionRef,
  likes,
  dislikes,
  isLiked,
  isDisliked,
  isSubscribed,
  isSaved,
  subscribersCount,
  notificationState,
  isAnimating,
  isShareModalOpen,
  onShareModalToggle,
  isMoreMenuOpen,
  onMoreMenuClick,
  isNotificationsModalOpen,
  isMiniplayerActive,
  onLike,
  onDislike,
  onSubscribe,
  onSave,
  onOpenComments,
  onNotificationsClick,
  onCloseNotifications,
  onReportClick,
  inlineModalsProps,
  onPurchaseComplete,
}: WatchPageAboveFoldProps) {
  const monetizationVideo = currentPlaylist && currentPlaylist.price
    ? {
        id: currentPlaylist.id,
        userId: currentPlaylist.creatorId || 'playlist-creator',
        title: currentPlaylist.title,
        description: currentPlaylist.description,
        videoUrl: '',
        views: 0,
        createdAt: new Date(currentPlaylist.lastUpdated),
        updatedAt: new Date(currentPlaylist.lastUpdated),
        type: (currentPlaylist.isSubscription ? 'subscription' : 'paid') as 'subscription' | 'paid',
        price: parseInt(currentPlaylist.price.replace(/[^\d]/g, '')) || 50000,
        currency: 'UZS',
        user: {
          id: currentPlaylist.creatorId || 'playlist-creator',
          name: currentPlaylist.creatorName,
          profileImageUrl: currentPlaylist.creatorAvatar,
        },
      }
    : video;

  return (
    <>
      {/* Video Player Placeholder - CRITICAL: Always render on watch page to provide portal target */}
      <div className="relative w-full aspect-video">
        <div id="video-player-placeholder" className="absolute inset-0">
          {/* Placeholder maintains space for the centralized VideoPlayer */}
          {/* The actual VideoPlayer is rendered here via React Portal from MainLayout */}
        </div>
        <WatchPageInlineModals {...inlineModalsProps} />
      </div>

      {/* Video Title */}
      <h1 className="text-xl font-semibold text-text-primary">{video.title}</h1>

      {/* Action Row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link href={`/${video.user?.username ?? video.userId}`}>
            {video.user?.profileImageUrl ? (
              <img
                src={video.user.profileImageUrl}
                alt={video.user.name || 'Creator'}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-text-secondary" />
              </div>
            )}
          </Link>
          <div className="flex-shrink-0">
            <Link href={`/${video.user?.username ?? video.userId}`}>
              <h3 className="font-medium text-text-primary hover:text-white whitespace-nowrap">
                {video.user?.name || 'Unknown Creator'}
              </h3>
            </Link>
            <p className="text-xs text-text-secondary whitespace-nowrap">
              {subscribersCount.toLocaleString()} subscribers
            </p>
          </div>
          {!isSubscribed && (
            <Button
              onClick={onSubscribe}
              className="rounded-full h-10 px-4 bg-accent hover:bg-accent/90 text-white transition-all duration-300 flex-shrink-0 whitespace-nowrap"
            >
              Subscribe
            </Button>
          )}
          {isSubscribed && isAnimating && (
            <Button
              disabled
              className="rounded-full h-10 px-4 bg-green-600 text-white transition-all duration-300 flex-shrink-0 whitespace-nowrap"
            >
              Subscribed 🎉
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-surface rounded-full p-1 h-10">
            <Button
              variant="ghost"
              onClick={onLike}
              className={`rounded-full gap-2 h-10 px-4 ${
                isLiked ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className={`text-sm font-medium ${isLiked ? 'text-text-primary' : ''}`}>
                {likes.toLocaleString()}
              </span>
            </Button>
            <div className="w-px h-6 bg-background" />
            <Button
              variant="ghost"
              onClick={onDislike}
              className={`rounded-full h-10 px-3 ${
                isDisliked ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <ThumbsDown className={`h-5 w-5 ${isDisliked ? 'fill-current' : ''}`} />
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={onShareModalToggle}
            className="rounded-full h-10 w-10 p-0 text-text-secondary hover:text-text-primary hover:bg-surface"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={onSave}
            className={`rounded-full h-10 w-10 p-0 hover:bg-surface ${
              isSaved ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            onClick={onOpenComments}
            disabled={!hasFullAccess}
            className={`lg:hidden rounded-full h-10 w-10 p-0 hover:bg-surface ${
              !hasFullAccess ? 'opacity-50 cursor-not-allowed' : 'text-text-secondary hover:text-text-primary'
            }`}
            title={!hasFullAccess ? 'Comments unavailable for restricted content' : 'Open comments'}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <div className="relative">
            <Button
              ref={moreButtonRef}
              variant="ghost"
              onClick={onMoreMenuClick}
              className="rounded-full h-10 w-10 p-0 text-text-secondary hover:text-text-primary hover:bg-surface"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
            {isMoreMenuOpen && (
              <div
                ref={moreMenuRef}
                className="absolute bottom-full right-0 mb-2 w-48 bg-surface border border-surface rounded-lg shadow-xl z-50 overflow-hidden"
              >
                <div className="flex flex-col py-1">
                  {isSubscribed && (
                    <button
                      onClick={onNotificationsClick}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-background text-text-primary transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Bell className={`h-5 w-5 text-text-secondary ${notificationState === 'ALL' ? 'fill-current' : ''}`} />
                        <span className="font-medium text-sm">Notifications</span>
                      </div>
                      {notificationState === 'ALL' && <Check className="h-4 w-4 text-white" />}
                    </button>
                  )}
                  <button
                    onClick={onReportClick}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-background text-text-primary transition-colors text-left"
                  >
                    <Flag className="h-5 w-5 text-text-secondary" />
                    <span className="font-medium text-sm">Report</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <VideoDescription
        views={video.views}
        createdAt={video.createdAt}
        description={video.description}
      />

      {!hasFullAccess && (
        <div className="lg:hidden">
          <MonetizationCTASection
            video={monetizationVideo}
            isPlaylist={!!(currentPlaylist && currentPlaylist.price)}
            onPurchase={() => {
              if (currentPlaylist?.price) {
                console.log('Purchase clicked for playlist:', currentPlaylist.id);
              } else {
                console.log('Purchase clicked for video:', video?.id);
              }
            }}
            onSubscribe={() => console.log('Subscribe clicked for channel:', video?.userId)}
            onPurchaseComplete={onPurchaseComplete}
          />
        </div>
      )}
    </>
  );
}
