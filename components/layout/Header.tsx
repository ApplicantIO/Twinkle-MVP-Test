'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Upload, User, LogOut, Settings, Globe, Palette, Monitor, Sun, Moon, MessageSquare, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [language, setLanguage] = useState('en');
  const [appearance, setAppearance] = useState('system');
  const [settingsView, setSettingsView] = useState<'main' | 'language' | 'appearance'>('main');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-surface z-50 flex items-center px-4">
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <span className="text-2xl font-bold text-accent">Twinkle</span>
      </Link>

      {/* Centered search bar */}
      <form onSubmit={handleSearch} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-12 bg-surface border-surface text-text-primary placeholder:text-text-secondary rounded-full h-10"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent/90 text-white rounded-full p-2 h-8 w-8 flex items-center justify-center"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
        {user ? (
          <>
            {(user.role === 'creator' || user.role === 'admin') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/studio/upload')}
                title="Upload video"
                className="text-text-secondary hover:text-text-primary hover:bg-surface"
              >
                <Upload className="h-5 w-5" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full text-text-secondary hover:text-text-primary hover:bg-surface"
                >
                  {user.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={user?.profileImageUrl}
                      alt={user?.name || 'User'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-surface border-surface">
                <DropdownMenuItem 
                  onClick={() => router.push('/studio')}
                  className="text-text-primary hover:bg-background"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Creator Studio
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-text-primary hover:bg-background"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="text-text-secondary hover:text-text-primary"
            >
              Sign In
            </Button>
            <Button
              onClick={() => {
                setAuthModalMode('signup');
                setIsAuthModalOpen(true);
              }}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              Sign Up
            </Button>
          </div>
        )}

        {/* Settings Dropdown - at the end */}
        <DropdownMenu open={settingsView !== 'main' || undefined} onOpenChange={(open) => {
          if (!open) setSettingsView('main');
        }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-text-secondary hover:text-text-primary hover:bg-surface"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface border-surface w-56">
            {settingsView === 'main' && (
              <>
                {/* Language */}
                <DropdownMenuItem
                  onClick={() => setSettingsView('language')}
                  className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
                >
                  <div className="flex gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Language</span>
                  </div>
                  <span className="text-xs text-text-secondary">{language.toUpperCase()}</span>
                </DropdownMenuItem>

                {/* Appearance */}
                <DropdownMenuItem
                  onClick={() => setSettingsView('appearance')}
                  className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
                >
                  <div className="flex gap-2">
                    <Palette className="h-4 w-4" />
                    <span>Appearance</span>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {appearance === 'system' ? '☽' : appearance === 'dark' ? '●' : '○'}
                  </span>
                </DropdownMenuItem>

                {/* Divider */}
                <div className="border-t border-surface my-1" />

                {/* Settings */}
                <DropdownMenuItem
                  onClick={() => {
                    if (user) {
                      router.push('/studio/settings');
                    } else {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>

                {/* Feedback */}
                <DropdownMenuItem
                  onClick={() => router.push('/feedback')}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  Feedback
                </DropdownMenuItem>

                {/* Help */}
                <DropdownMenuItem
                  onClick={() => router.push('/help')}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  Help
                </DropdownMenuItem>
              </>
            )}

            {settingsView === 'language' && (
              <>
                <DropdownMenuItem
                  onClick={() => setSettingsView('main')}
                  className="text-text-primary hover:bg-background cursor-pointer mb-2"
                >
                  ← Back
                </DropdownMenuItem>
                <div className="border-t border-surface my-1" />
                
                <button
                  onClick={() => {
                    setLanguage('en');
                    setSettingsView('main');
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    language === 'en'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    setLanguage('uz');
                    setSettingsView('main');
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    language === 'uz'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  Ўзбек
                </button>
                <button
                  onClick={() => {
                    setLanguage('ru');
                    setSettingsView('main');
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    language === 'ru'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  Русский
                </button>
              </>
            )}

            {settingsView === 'appearance' && (
              <>
                <DropdownMenuItem
                  onClick={() => setSettingsView('main')}
                  className="text-text-primary hover:bg-background cursor-pointer mb-2"
                >
                  ← Back
                </DropdownMenuItem>
                <div className="border-t border-surface my-1" />
                
                <button
                  onClick={() => {
                    setAppearance('light');
                    setSettingsView('main');
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    appearance === 'light'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => {
                    setAppearance('dark');
                    setSettingsView('main');
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    appearance === 'dark'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => {
                    setAppearance('system');
                    setSettingsView('main');
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    appearance === 'system'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  System
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authModalMode} />
    </header>
  );
}
