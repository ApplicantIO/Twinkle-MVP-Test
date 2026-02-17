'use client';

export type ProfileTabId = 'featured' | 'videos' | 'playlists' | 'fanzone';

export interface ProfileTabsProps {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
}

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'videos', label: 'Videos' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'fanzone', label: 'Fanzone' },
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="flex gap-1 px-6 pb-6 border-b border-surface/50">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
