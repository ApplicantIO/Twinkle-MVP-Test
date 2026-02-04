'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  LogOut,
  Settings,
  Globe,
  Monitor,
  Sun,
  Moon,
  MessageSquare,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MOCK_SECONDARY_ACCOUNT } from '@/config/viewerConstants';
import type { User as UserType } from '@/types';
import { cn } from '@/lib/utils';

function getDisplayName(user: UserType | null): string {
  if (!user) return 'User';
  const firstName = (() => {
    if (!user.name) return user.email?.split('@')[0] || null;
    const trimmed = user.name.trim();
    const clean = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
    const parts = clean.split(/\s+/);
    if (parts.length > 1) return parts[0];
    if (/^[a-z0-9_-]+$/.test(clean) && clean.length > 0) {
      const emailPrefix = user.email?.split('@')[0];
      if (emailPrefix && emailPrefix.toLowerCase() !== clean.toLowerCase()) {
        return emailPrefix;
      }
      return clean;
    }
    return clean;
  })();
  if (firstName) {
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  }
  return user.email?.split('@')[0] || 'User';
}

function getInitial(user: UserType | null): string {
  if (!user) return 'U';
  return getDisplayName(user).charAt(0).toUpperCase();
}

export type HeaderProfileMenuProps = {
  user: UserType | null;
  onLogout: (e?: React.MouseEvent) => void;
};

export function HeaderProfileMenu({ user, onLogout }: HeaderProfileMenuProps) {
  const router = useRouter();
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [language, setLanguage] = useState('en');
  const [appearance, setAppearance] = useState('system');
  const [settingsView, setSettingsView] = useState<
    'main' | 'language' | 'appearance' | 'switchAccount'
  >('main');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const userRole = (user?.role as 'viewer' | 'creator' | 'admin') || 'viewer';
  const displayName = getDisplayName(user);
  const initial = getInitial(user);

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSettingsOpen(false);
    onLogout();
  };

  const handleAccountSelect = (accountEmail: string) => {
    setSettingsView('main');
    console.log('Switched to account:', accountEmail);
  };

  const handleAddAccount = () => {
    setSettingsView('main');
    console.log('Add account clicked');
  };

  const closeAndReset = (open: boolean) => {
    if (open !== isSettingsOpen) {
      setIsSettingsOpen(open);
      if (!open) {
        setSettingsView('main');
        setTimeout(() => profileButtonRef.current?.blur(), 0);
      }
    }
  };

  if (user) {
    return (
      <DropdownMenu open={isSettingsOpen} onOpenChange={closeAndReset}>
        <DropdownMenuTrigger asChild>
          <button
            ref={profileButtonRef}
            className="flex items-center gap-2.5 pl-3 pr-1 h-10 rounded-full bg-surface border border-transparent hover:border-gray-500 transition-colors focus:outline-none"
          >
            <span className="text-sm font-medium text-text-primary">
              {displayName}
            </span>
            {user.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profileImageUrl}
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white font-medium text-sm">
                {initial}
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-surface border-surface w-56"
        >
          {settingsView === 'main' && (
            <>
              <DropdownMenuItem
                onClick={() => router.push('/profile')}
                className="text-text-primary hover:bg-background cursor-pointer"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSettingsView('switchAccount');
                }}
                className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
              >
                <div className="flex gap-2">
                  <User className="h-4 w-4" />
                  <span>Switch account</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout(e);
                }}
                className="text-text-primary hover:bg-background cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </DropdownMenuItem>
              <div className="border-t border-gray-700 my-1" />
              <DropdownMenuItem
                onClick={() => router.push('/become-creator')}
                className="text-text-primary hover:bg-background cursor-pointer"
              >
                <User className="h-4 w-4 mr-2" />
                Become Creator
              </DropdownMenuItem>
              {(userRole === 'creator' || userRole === 'admin') && (
                <DropdownMenuItem
                  onClick={() => router.push('/studio')}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Twinkle Studio
                </DropdownMenuItem>
              )}
              <div className="border-t border-gray-700 my-1" />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSettingsView('language');
                  setIsSettingsOpen(true);
                }}
                className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
              >
                <div className="flex gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Language</span>
                </div>
                <span className="text-xs text-text-secondary">
                  {language.toUpperCase()}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSettingsView('appearance');
                }}
                className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
              >
                <div className="flex gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Appearance</span>
                </div>
                <span className="text-xs text-text-secondary">
                  {appearance === 'system' ? (
                    <Monitor className="h-3 w-3" />
                  ) : appearance === 'dark' ? (
                    <Moon className="h-3 w-3" />
                  ) : (
                    <Sun className="h-3 w-3" />
                  )}
                </span>
              </DropdownMenuItem>
              <div className="border-t border-gray-700 my-1" />
              <DropdownMenuItem
                onClick={() => router.push('/feedback')}
                className="text-text-primary hover:bg-background cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/help')}
                className="text-text-primary hover:bg-background cursor-pointer"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </DropdownMenuItem>
            </>
          )}
          {settingsView === 'language' && (
            <>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setSettingsView('main');
                }}
                className="text-text-primary hover:bg-background cursor-pointer mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </DropdownMenuItem>
              <div className="border-t border-gray-700 my-1" />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLanguage('uz');
                  setSettingsView('main');
                }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                  language === 'uz'
                    ? 'bg-accent text-white'
                    : 'text-text-primary hover:bg-background'
                )}
              >
                O&apos;zbek 🇺🇿
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLanguage('en');
                  setSettingsView('main');
                }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                  language === 'en'
                    ? 'bg-accent text-white'
                    : 'text-text-primary hover:bg-background'
                )}
              >
                English 🇬🇧
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLanguage('ru');
                  setSettingsView('main');
                }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                  language === 'ru'
                    ? 'bg-accent text-white'
                    : 'text-text-primary hover:bg-background'
                )}
              >
                Russian 🇷🇺
              </DropdownMenuItem>
            </>
          )}
          {settingsView === 'appearance' && (
            <>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setSettingsView('main');
                }}
                className="text-text-primary hover:bg-background cursor-pointer mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </DropdownMenuItem>
              <div className="border-t border-gray-700 my-1" />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAppearance('system');
                  setSettingsView('main');
                }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                  appearance === 'system'
                    ? 'bg-accent text-white'
                    : 'text-text-primary hover:bg-background'
                )}
              >
                <Monitor className="h-4 w-4" />
                System
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAppearance('light');
                  setSettingsView('main');
                }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                  appearance === 'light'
                    ? 'bg-accent text-white'
                    : 'text-text-primary hover:bg-background'
                )}
              >
                <Sun className="h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAppearance('dark');
                  setSettingsView('main');
                }}
                className={cn(
                  'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                  appearance === 'dark'
                    ? 'bg-accent text-white'
                    : 'text-text-primary hover:bg-background'
                )}
              >
                <Moon className="h-4 w-4" />
                Dark
              </DropdownMenuItem>
            </>
          )}
          {settingsView === 'switchAccount' && (
            <>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSettingsView('main');
                }}
                className="text-text-primary hover:bg-background cursor-pointer mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </DropdownMenuItem>
              <div className="border-t border-gray-700 my-1" />
              {user && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (user?.email) handleAccountSelect(user.email);
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                    {initial}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary">
                      {displayName}
                    </span>
                    <span className="text-xs text-text-secondary truncate">
                      {user?.email || 'No email'}
                    </span>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAccountSelect(MOCK_SECONDARY_ACCOUNT.email);
                }}
                className="text-text-primary hover:bg-background cursor-pointer flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                  {MOCK_SECONDARY_ACCOUNT.firstName.charAt(0)}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium text-text-primary">
                    {MOCK_SECONDARY_ACCOUNT.firstName}{' '}
                    {MOCK_SECONDARY_ACCOUNT.lastName}
                  </span>
                  <span className="text-xs text-text-secondary truncate">
                    {MOCK_SECONDARY_ACCOUNT.email}
                  </span>
                </div>
              </DropdownMenuItem>
              <div className="border-t border-gray-700 my-1" />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddAccount();
                }}
                className="text-text-primary hover:bg-background cursor-pointer"
              >
                <User className="h-4 w-4 mr-2" />
                Add Account
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Logged-out: only settings gear dropdown
  return (
    <DropdownMenu
      open={isSettingsOpen}
      onOpenChange={(open) => {
        if (open !== isSettingsOpen) {
          setIsSettingsOpen(open);
          if (!open) setSettingsView('main');
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'text-text-secondary hover:text-text-primary hover:bg-surface',
            isSettingsOpen && 'bg-surface text-text-primary'
          )}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-surface border-surface w-56">
        {settingsView === 'main' && (
          <>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setSettingsView('language');
              }}
              className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
            >
              <div className="flex gap-2">
                <Globe className="h-4 w-4" />
                <span>Language</span>
              </div>
              <span className="text-xs text-text-secondary">
                {language.toUpperCase()}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setSettingsView('appearance');
              }}
              className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
            >
              <div className="flex gap-2">
                <Moon className="h-4 w-4" />
                <span>Appearance</span>
              </div>
              <span className="text-xs text-text-secondary">
                {appearance === 'system' ? (
                  <Monitor className="h-3 w-3" />
                ) : appearance === 'dark' ? (
                  <Moon className="h-3 w-3" />
                ) : (
                  <Sun className="h-3 w-3" />
                )}
              </span>
            </DropdownMenuItem>
            <div className="border-t border-gray-700 my-1" />
            <DropdownMenuItem
              onClick={() => router.push('/feedback')}
              className="text-text-primary hover:bg-background cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push('/help')}
              className="text-text-primary hover:bg-background cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </DropdownMenuItem>
          </>
        )}
        {settingsView === 'language' && (
          <>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setSettingsView('main');
              }}
              className="text-text-primary hover:bg-background cursor-pointer mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </DropdownMenuItem>
            <div className="border-t border-gray-700 my-1" />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setLanguage('uz');
                setSettingsView('main');
                setIsSettingsOpen(false);
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                language === 'uz'
                  ? 'bg-accent text-white'
                  : 'text-text-primary hover:bg-background'
              )}
            >
              O&apos;zbek 🇺🇿
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setLanguage('en');
                setSettingsView('main');
                setIsSettingsOpen(false);
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                language === 'en'
                  ? 'bg-accent text-white'
                  : 'text-text-primary hover:bg-background'
              )}
            >
              English 🇬🇧
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setLanguage('ru');
                setSettingsView('main');
                setIsSettingsOpen(false);
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                language === 'ru'
                  ? 'bg-accent text-white'
                  : 'text-text-primary hover:bg-background'
              )}
            >
              Russian 🇷🇺
            </DropdownMenuItem>
          </>
        )}
        {settingsView === 'appearance' && (
          <>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setSettingsView('main');
              }}
              className="text-text-primary hover:bg-background cursor-pointer mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </DropdownMenuItem>
            <div className="border-t border-gray-700 my-1" />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setAppearance('system');
                setSettingsView('main');
                setIsSettingsOpen(false);
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                appearance === 'system'
                  ? 'bg-accent text-white'
                  : 'text-text-primary hover:bg-background'
              )}
            >
              <Monitor className="h-4 w-4" />
              System
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setAppearance('light');
                setSettingsView('main');
                setIsSettingsOpen(false);
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                appearance === 'light'
                  ? 'bg-accent text-white'
                  : 'text-text-primary hover:bg-background'
              )}
            >
              <Sun className="h-4 w-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setAppearance('dark');
                setSettingsView('main');
                setIsSettingsOpen(false);
              }}
              className={cn(
                'w-full text-left px-4 py-2 text-sm flex items-center gap-2',
                appearance === 'dark'
                  ? 'bg-accent text-white'
                  : 'text-text-primary hover:bg-background'
              )}
            >
              <Moon className="h-4 w-4" />
              Dark
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
