'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Upload, User, LogOut, Settings, Globe, Palette, Monitor, Sun, Moon, MessageSquare, HelpCircle } from 'lucide-react';
import { Search, Upload, User, LogOut, Settings, Globe, Palette, Monitor, Sun, Moon, MessageSquare, HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [language, setLanguage] = useState('en');
  const [appearance, setAppearance] = useState('system');
  const [settingsView, setSettingsView] = useState<'main' | 'language' | 'appearance'>('main');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
            className="pl-4 pr-12 bg-surface border border-gray-700 text-text-primary placeholder:text-text-secondary rounded-full h-10 focus:border-gray-600"
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
        <DropdownMenu 
          open={isSettingsOpen} 
          onOpenChange={(open) => {
            setIsSettingsOpen(open);
            if (!open) {
              setSettingsView('main');
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-text-secondary hover:text-text-primary hover:bg-surface",
                isSettingsOpen && "bg-surface text-text-primary"
              )}
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
                  <span className="text-xs text-text-secondary">{language.toUpperCase()}</span>
                </DropdownMenuItem>

                {/* Appearance */}
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
                    {appearance === 'system' ? <Monitor className="h-3 w-3" /> : appearance === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                  </span>
                </DropdownMenuItem>

                {/* Divider */}
                <div className="border-t border-surface my-1" />

                {/* Feedback */}
                <DropdownMenuItem
                  onClick={() => router.push('/feedback')}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback
                </DropdownMenuItem>

                {/* Help */}
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
                  ← Back
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </DropdownMenuItem>
                <div className="border-t border-surface my-1" />
                
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setLanguage('uz');
                    setSettingsView('main');
                    setIsSettingsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    language === 'uz'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  O'zbek 🇺🇿
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setLanguage('en');
                    setSettingsView('main');
                    setIsSettingsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    language === 'en'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
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
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    language === 'ru'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
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
                  ← Back
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </DropdownMenuItem>
                <div className="border-t border-surface my-1" />
                
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setAppearance('system');
                    setSettingsView('main');
                    setIsSettingsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    appearance === 'system'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
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
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    appearance === 'light'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
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
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                    appearance === 'dark'
                      ? 'bg-accent text-white'
                      : 'text-text-primary hover:bg-background'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </DropdownMenuItem>
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
