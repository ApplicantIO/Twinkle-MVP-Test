'use client';

export interface ProfileHeaderProps {
  name: string;
  subscribers: number;
  onSubscribe?: () => void;
}

export function ProfileHeader({ name, subscribers, onSubscribe }: ProfileHeaderProps) {
  const formattedSubs = subscribers >= 1000 
    ? `${(subscribers / 1000).toFixed(1)}K subscribers` 
    : `${subscribers} subscribers`;

  return (
    <header className="sticky top-20 z-10 bg-surface/95 backdrop-blur px-6 py-4 border-b border-surface/50">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-primary">{name}</h1>
        <span className="text-xl text-text-secondary hidden sm:block">{formattedSubs}</span>
        <button
          onClick={onSubscribe}
          className="bg-accent hover:bg-accent/90 text-background font-semibold px-8 py-2 rounded-full transition-colors"
        >
          Subscribe
        </button>
      </div>
    </header>
  );
}
