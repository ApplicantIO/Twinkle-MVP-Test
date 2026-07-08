'use client';

import { Ticket, Heart } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';

const DESCRIPTION_MAX_VISIBLE = 60;

/** Avatar size on desktop (180×180px square) */
const AVATAR_SIZE_PX = 180;

export interface CreatorInfoSectionProps {
  creatorName: string;
  username: string;
  subscribersCount: number;
  videoCount: number;
  description: string;
  creatorPhoto: string | null;
  onSubscribe?: () => void;
}

export function CreatorInfoSection({
  creatorName,
  username,
  subscribersCount,
  videoCount,
  description,
  creatorPhoto,
  onSubscribe,
}: CreatorInfoSectionProps) {
  const { openCreatorAboutModal } = useModal();
  const truncated = description.length > DESCRIPTION_MAX_VISIBLE
    ? description.slice(0, DESCRIPTION_MAX_VISIBLE).trim() + '…'
    : description;
  const hasMore = description.length > DESCRIPTION_MAX_VISIBLE;

  const handleMoreClick = () => {
    openCreatorAboutModal(creatorName, description);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-3">
      {/* Column 1 — Avatar: 180×180px square on desktop */}
      <div className="flex shrink-0 justify-center md:block">
        <div className="relative block w-24 h-24 rounded-[14px] border border-[#1A1A1A] overflow-hidden bg-surface md:w-[128px] md:h-[128px]">
          {creatorPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creatorPhoto}
              alt={creatorName}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
        </div>
      </div>

      {/* Column 2 — Meta + CTA (defines Info section height) */}
      <div className="min-w-0 flex-1 flex flex-col gap-1 pt-0.5">
        <h1 className="text-[40px] font-bold text-text-primary leading-none">
          {creatorName}
        </h1>
        <p className="text-sm text-text-secondary">@{username}</p>
        <p className="text-sm text-text-secondary">
          {subscribersCount.toLocaleString()} subscribers · {videoCount} videos
        </p>
        <div className="text-sm text-text-secondary mt-0.5 max-w-[780px]">
          <span>{truncated}</span>
          {hasMore && (
            <button
              type="button"
              onClick={handleMoreClick}
              className="text-white font-semibold opacity-90 hover:opacity-100 ml-0.5 focus:outline-none focus:ring-0"
            >
              …more
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onSubscribe}
            className="rounded-full h-10 px-5 text-sm font-medium border border-[#2A2A2A] bg-[#1A1A1A] text-text-primary hover:bg-[#222] transition-colors"
          >
            Obunadasiz!
          </button>
          <button
            type="button"
            className="rounded-full h-10 px-5 text-sm font-medium bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            Premium
          </button>
        </div>
      </div>

      {/* Column 3 — Secondary CTA: Tickets, Donate, top-right */}
      <div className="flex flex-wrap gap-2 justify-center md:justify-end md:items-start md:ml-auto md:pt-1">
        <button
          type="button"
          className="rounded-full h-10 px-4 text-sm font-medium border border-[#2E2E2E] bg-[#151515] text-[#F59E0B] hover:bg-[#202020] inline-flex items-center gap-2"
        >
          <Ticket className="h-4 w-4 shrink-0" aria-hidden />
          Chiptalar
        </button>
        <button
          type="button"
          className="rounded-full h-10 px-4 text-sm font-medium border border-[#2E2E2E] bg-[#151515] text-[#10B981] hover:bg-[#202020] inline-flex items-center gap-2"
        >
          <Heart className="h-4 w-4 shrink-0" aria-hidden />
          Donat
        </button>
      </div>
    </div>
  );
}
