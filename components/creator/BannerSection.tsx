'use client';

/**
 * Block 1 — Creator profile banner.
 * Top margin 10px, 14px radius, 2px border #1A1A1A, ~196px height, responsive width.
 */
export function BannerSection() {
  return (
    <div
      className="mt-2.5 w-full h-[168px] min-h-[120px] max-h-[196px] rounded-[14px] border border-[#1A1A1A] bg-surface"
      style={{ minHeight: 140 }}
      role="img"
      aria-label="Channel banner"
    />
  );
}
