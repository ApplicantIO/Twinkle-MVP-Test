'use client';

import { motion } from 'framer-motion';

export type CommentSectionHeaderType = 'donation' | 'tabs' | 'report';

export interface WatchPageCommentsProps {
  /** Ref for the outer container (e.g. for scroll-into-view from purchase complete) */
  sectionRef?: React.RefObject<HTMLDivElement | null>;
  /** Which header to show: donation (back+title), tabs (Comments | Donations), or report (back+reason) */
  headerType: CommentSectionHeaderType;
  /** Rendered when headerType === 'donation' (e.g. WatchPageDonation header or custom) */
  donationHeader: React.ReactNode;
  /** Rendered when headerType === 'tabs' (Comments / Donations tab buttons) */
  tabsContent: React.ReactNode;
  /** Rendered when headerType === 'report' (back + reason title) */
  reportHeaderContent: React.ReactNode;
  /** Main scrollable body: donation form, comments list, or report flow */
  bodyContent: React.ReactNode;
  /** Optional footer: comment input bar or report submit buttons */
  footerContent: React.ReactNode | null;
}

const tabTransition = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
};

/**
 * Layout for the watch page right column (comments/donations section).
 * Renders sticky header (donation, tabs, or report), scrollable body, and optional footer.
 * The page supplies all content; this component only handles structure.
 */
export function WatchPageComments({
  sectionRef,
  headerType,
  donationHeader,
  tabsContent,
  reportHeaderContent,
  bodyContent,
  footerContent,
}: WatchPageCommentsProps) {
  return (
    <div
      ref={sectionRef}
      className="hidden lg:flex w-[400px] flex-shrink-0 flex-col h-full overflow-hidden bg-[#1A1A1A] rounded-xl"
    >
      <div className="sticky top-0 z-10 bg-[#1A1A1A] border-b border-surface/50">
        {headerType === 'donation' && donationHeader}
        {headerType === 'tabs' && <div className="flex relative">{tabsContent}</div>}
        {headerType === 'report' && reportHeaderContent}
      </div>
      {bodyContent}
      {footerContent}
    </div>
  );
}

/**
 * Renders the Comments / Donations tab buttons (for use as tabsContent).
 * Shared so the page can pass the same tab UI without duplicating motion layoutId.
 */
export function WatchPageCommentsTabs({
  activeTab,
  onPublicTab,
  onDonatedTab,
  isLive,
}: {
  activeTab: 'public' | 'donated';
  onPublicTab: () => void;
  onDonatedTab: () => void;
  isLive?: boolean;
}) {
  return (
    <>
      <button
        onClick={onPublicTab}
        className={`flex-1 px-3 py-3 text-sm font-medium transition-colors relative ${
          activeTab === 'public' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        {isLive ? 'Chat' : 'Comments'}
        {activeTab === 'public' && (
          <motion.div
            layoutId="activeCommentsTab"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-500 rounded-full"
            transition={tabTransition}
          />
        )}
      </button>
      <button
        onClick={onDonatedTab}
        className={`flex-1 px-3 py-3 text-sm font-medium transition-colors relative ${
          activeTab === 'donated' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        {isLive ? 'Superchat' : 'Donations'}
        {activeTab === 'donated' && (
          <motion.div
            layoutId="activeCommentsTab"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-500 rounded-full"
            transition={tabTransition}
          />
        )}
      </button>
    </>
  );
}
