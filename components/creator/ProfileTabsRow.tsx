'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const tabTransition = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
};

export type ProfileTabId =
  | 'home'
  | 'videos'
  | 'live'
  | 'playlists'
  | 'posts'
  | 'fanzone'
  | 'merch';

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'videos', label: 'Videos' },
  { id: 'live', label: 'Live' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'posts', label: 'Posts' },
  { id: 'fanzone', label: 'Fanzone' },
  { id: 'merch', label: 'Merch' },
];

export interface ProfileTabsRowProps {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
}

export function ProfileTabsRow({ activeTab, onTabChange }: ProfileTabsRowProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-1 border-b border-[#1A1A1A] pb-0">
      <div className="flex flex-1 min-w-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-3 py-3 text-sm font-medium transition-colors shrink-0 ${
              activeTab === tab.id
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && !isSearchFocused && (
              <motion.div
                layoutId="creatorProfileTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-500 rounded-full"
                transition={tabTransition}
              />
            )}
          </button>
        ))}
      </div>
      {/* Search: acts like tab when focused, underline + caret visible */}
      <div
        className="relative flex items-center gap-2 px-3 py-3 text-sm shrink-0 cursor-text min-w-[140px]"
        onClick={() => inputRef.current?.focus()}
      >
        <Search
          className={`h-4 w-4 shrink-0 ${isSearchFocused ? 'text-text-primary' : 'text-text-secondary'}`}
          aria-hidden
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search from channel"
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-text-secondary placeholder:text-text-secondary focus:text-text-primary focus:placeholder:text-transparent caret-white"
          style={{ caretColor: '#FFFFFF' }}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          aria-label="Search from channel"
        />
        {isSearchFocused && (
          <motion.div
            layoutId="creatorProfileTab"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-500 rounded-full"
            transition={tabTransition}
          />
        )}
      </div>
    </div>
  );
}
