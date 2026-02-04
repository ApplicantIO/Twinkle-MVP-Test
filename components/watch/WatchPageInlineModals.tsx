'use client';

import { RefObject } from 'react';
import { X, Copy, Check, ArrowLeft, CheckCircle2, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const REPORT_REASONS = [
  'Misinformation',
  'Violence or hate',
  'Promoting restricts',
  'Nudity or sexual',
  'Scam',
  "I don't like it",
  'Write',
];

export type ReportStepType = 'CLOSED' | 'SELECT_REASON' | 'WRITE_DETAILS' | 'SUBMITTED_CONFIRMATION';
export type NotificationStateType = 'NONE' | 'ALL' | 'PERSONALIZED';

export interface WatchPageInlineModalsProps {
  shareModalRef: RefObject<HTMLDivElement | null>;
  reportModalRef: RefObject<HTMLDivElement | null>;
  notificationsModalRef: RefObject<HTMLDivElement | null>;
  isShareModalOpen: boolean;
  onCloseShare: () => void;
  getVideoUrl: () => string;
  isLinkCopied: boolean;
  onCopyLink: () => void;
  reportStep: ReportStepType;
  reportReason: string;
  reportDetails: string;
  onReportReasonSelect: (reason: string) => void;
  onReportSubmit: () => void;
  onCloseReport: () => void;
  onBackReport: () => void;
  onReportDetailsChange: (value: string) => void;
  isNotificationsModalOpen: boolean;
  onCloseNotifications: () => void;
  notificationState: NotificationStateType;
  onNotificationStateChange: (state: NotificationStateType) => void;
  isMiniplayerActive: boolean;
}

export function WatchPageInlineModals({
  shareModalRef,
  reportModalRef,
  notificationsModalRef,
  isShareModalOpen,
  onCloseShare,
  getVideoUrl,
  isLinkCopied,
  onCopyLink,
  reportStep,
  reportReason,
  reportDetails,
  onReportReasonSelect,
  onReportSubmit,
  onCloseReport,
  onBackReport,
  onReportDetailsChange,
  isNotificationsModalOpen,
  onCloseNotifications,
  notificationState,
  onNotificationStateChange,
  isMiniplayerActive,
}: WatchPageInlineModalsProps) {
  const videoUrl = getVideoUrl();
  const socialNetworks = [
    { name: 'Telegram', icon: 'TG', color: 'bg-[#0088cc]', url: `https://t.me/share/url?url=${encodeURIComponent(videoUrl)}` },
    { name: 'Instagram', icon: 'IG', color: 'bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743]', url: 'https://www.instagram.com/' },
    { name: 'X', icon: 'X', color: 'bg-black', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}` },
    { name: 'Facebook', icon: 'FB', color: 'bg-[#1877f2]', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}` },
    { name: 'LinkedIn', icon: 'LI', color: 'bg-[#0077b5]', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}` },
    { name: 'Email', icon: '✉', color: 'bg-[#ea4335]', url: `mailto:?subject=Check out this video&body=${encodeURIComponent(videoUrl)}` },
    { name: 'VK', icon: 'VK', color: 'bg-[#0077ff]', url: `https://vk.com/share.php?url=${encodeURIComponent(videoUrl)}` },
  ];

  return (
    <>
      {/* Share Modal - Centered in Video Player Area */}
      {isShareModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg">
          <div
            className="absolute inset-0 bg-black/70 rounded-lg"
            onClick={onCloseShare}
          />
          <div
            ref={shareModalRef}
            className="relative bg-surface border border-surface rounded-lg shadow-xl z-70 p-5 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onCloseShare}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close share modal"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-5 pr-8">
              <label className="text-xs font-medium text-text-secondary mb-2 block">Share link</label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={getVideoUrl()}
                  readOnly
                  className="flex-1 bg-background border-surface text-text-primary text-sm"
                />
                <Button
                  onClick={onCopyLink}
                  size="sm"
                  className={`rounded-full gap-2 ${
                    isLinkCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-accent hover:bg-accent/90 text-white'
                  }`}
                >
                  {isLinkCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-3 block">Share to</label>
              <div className="grid grid-cols-4 gap-3">
                {socialNetworks.map((network) => (
                  <a
                    key={network.name}
                    href={network.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onCloseShare}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg bg-background hover:scale-105 border border-surface transition-all duration-200 group cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-full ${network.color} flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow`}>
                      {network.icon}
                    </div>
                    <span className="text-xs text-text-secondary group-hover:text-text-primary text-center leading-tight font-medium">
                      {network.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal - Centered in Video Player Area */}
      {reportStep !== 'CLOSED' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg">
          <div
            className="absolute inset-0 bg-black/80 rounded-lg"
            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
            onClick={onCloseReport}
          />
          <div
            ref={reportModalRef}
            className="relative bg-surface border border-surface rounded-lg shadow-xl z-70 p-5 max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onCloseReport}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors z-10"
              aria-label="Close report modal"
            >
              <X className="h-5 w-5" />
            </button>
            {reportStep === 'SELECT_REASON' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={onBackReport}
                    className="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-semibold text-text-primary">Report video</h2>
                </div>
                <div className="flex-1 overflow-y-auto pr-2">
                  <p className="text-sm text-text-secondary mb-4">
                    Tell us why you&apos;re reporting this video
                  </p>
                  <div className="flex flex-col gap-1">
                    {REPORT_REASONS.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => onReportReasonSelect(reason)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-background text-text-primary transition-colors text-left"
                      >
                        <span className="font-medium">{reason}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {reportStep === 'WRITE_DETAILS' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={onBackReport}
                    className="p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-semibold text-text-primary">{reportReason}</h2>
                </div>
                <div className="flex-1 flex flex-col mb-4">
                  <label className="text-sm font-medium text-text-secondary mb-2 block">
                    Additional details <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={reportDetails}
                    onChange={(e) => onReportDetailsChange(e.target.value)}
                    placeholder="Provide more information about why you're reporting this video..."
                    className="flex-1 min-h-[120px] bg-background border-surface text-text-primary placeholder:text-text-secondary resize-none"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={onBackReport}
                    variant="outline"
                    className="flex-1 rounded-full border-surface bg-background hover:bg-surface hover:border-surface"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={onReportSubmit}
                    disabled={!reportDetails.trim()}
                    className="flex-1 rounded-full bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}
            {reportStep === 'SUBMITTED_CONFIRMATION' && (
              <div className="flex flex-col items-center justify-center min-h-[300px] py-8">
                <div className="flex flex-col items-center gap-4 opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]">
                  <div className="relative">
                    <CheckCircle2 className="h-20 w-20 text-green-500" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-text-primary mb-2">Report Submitted</h2>
                    <p className="text-sm text-text-secondary">Thank you for your feedback.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Modal - Only show when player placeholder is visible */}
      {!isMiniplayerActive && isNotificationsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80"
            style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
            onClick={onCloseNotifications}
          />
          <div
            ref={notificationsModalRef}
            className="relative bg-surface border border-surface rounded-lg shadow-xl z-70 p-5 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onCloseNotifications}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors z-10"
              aria-label="Close notifications modal"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col h-full">
              <h2 className="text-lg font-semibold text-text-primary mb-4 pr-8">Notifications</h2>
              <div className="flex-1 flex flex-col">
                <p className="text-sm text-text-secondary mb-4">
                  Choose how you want to be notified about new content from this channel
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onNotificationStateChange('ALL')}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-colors text-left ${
                      notificationState === 'ALL'
                        ? 'bg-background border border-white/20'
                        : 'hover:bg-background border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-text-secondary fill-current" />
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">All notifications</span>
                        <span className="text-xs text-text-secondary">Get notified about all new videos and posts</span>
                      </div>
                    </div>
                    {notificationState === 'ALL' && <Check className="h-5 w-5 text-white" />}
                  </button>
                  <button
                    onClick={() => onNotificationStateChange('NONE')}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-colors text-left ${
                      notificationState === 'NONE'
                        ? 'bg-background border border-white/20'
                        : 'hover:bg-background border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BellOff className="h-5 w-5 text-text-secondary" />
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">No notifications</span>
                        <span className="text-xs text-text-secondary">Don&apos;t send me any notifications</span>
                      </div>
                    </div>
                    {notificationState === 'NONE' && <Check className="h-5 w-5 text-white" />}
                  </button>
                  <button
                    onClick={() => onNotificationStateChange('PERSONALIZED')}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-colors text-left ${
                      notificationState === 'PERSONALIZED'
                        ? 'bg-background border border-white/20'
                        : 'hover:bg-background border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-text-secondary" />
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary">Personalized</span>
                        <span className="text-xs text-text-secondary">Only notify me about content I might like</span>
                      </div>
                    </div>
                    {notificationState === 'PERSONALIZED' && <Check className="h-5 w-5 text-white" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
