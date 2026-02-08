'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Home, 
  Headphones, 
  Users, 
  Settings, 
  History, 
  Bookmark, 
  User, 
  LogOut, 
  Globe, 
  Moon, 
  Monitor, 
  Sun,
  MessageSquare,
  HelpCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user, logout } = useAuth();
  const { openAuthModal } = useModal();
  const router = useRouter();
  const [language, setLanguage] = useState('en');
  const [appearance, setAppearance] = useState('system');
  const [settingsView, setSettingsView] = useState<'main' | 'language' | 'appearance'>('main');

  const handleLogout = () => {
    logout();
    router.push('/');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-[799] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Menu */}
      <div className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-[400px] bg-background border-l border-surface z-[800] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface">
          <h2 className="text-lg font-semibold text-text-primary">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {settingsView === 'main' && (
            <>
              {/* User Section */}
              {user ? (
                <div className="p-4 border-b border-surface">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-white font-medium">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-b border-surface flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openAuthModal('signin')}
                    className="flex-1"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => openAuthModal('signup')}
                    className="flex-1 bg-accent hover:bg-accent/90"
                  >
                    Sign Up
                  </Button>
                </div>
              )}

              {/* Navigation Items */}
              <div className="py-2">
                <Link
                  href="/"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors"
                >
                  <Home className="h-5 w-5 text-text-secondary" />
                  <span className="font-medium">Home</span>
                </Link>
                <Link
                  href="/podcast"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors"
                >
                  <Headphones className="h-5 w-5 text-text-secondary" />
                  <span className="font-medium">Podcast</span>
                </Link>
                <Link
                  href="/fanzone"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors"
                >
                  <Users className="h-5 w-5 text-text-secondary" />
                  <span className="font-medium">Fanzone</span>
                </Link>
              </div>

              {/* Your Activity Section */}
              {user && (
                <>
                  <div className="border-t border-surface my-2" />
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase">
                      Your Activity
                    </div>
                    <Link
                      href="/history"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors"
                    >
                      <History className="h-5 w-5 text-text-secondary" />
                      <span>History</span>
                    </Link>
                    <Link
                      href="/saved"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors"
                    >
                      <Bookmark className="h-5 w-5 text-text-secondary" />
                      <span>Saved</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors"
                    >
                      <User className="h-5 w-5 text-text-secondary" />
                      <span>Profile</span>
                    </Link>
                  </div>
                </>
              )}

              {/* Settings Section */}
              <div className="border-t border-surface my-2" />
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase">
                  Settings
                </div>
                <button
                  onClick={() => setSettingsView('language')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-text-secondary" />
                    <span>Language</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">{language.toUpperCase()}</span>
                    <ArrowRight className="h-4 w-4 text-text-secondary" />
                  </div>
                </button>
                <button
                  onClick={() => setSettingsView('appearance')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Moon className="h-5 w-5 text-text-secondary" />
                    <span>Appearance</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-secondary" />
                </button>
                <Link
                  href="/feedback"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors"
                >
                  <MessageSquare className="h-5 w-5 text-text-secondary" />
                  <span>Feedback</span>
                </Link>
                <Link
                  href="/help"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors"
                >
                  <HelpCircle className="h-5 w-5 text-text-secondary" />
                  <span>Help</span>
                </Link>
              </div>

              {/* Logout */}
              {user && (
                <>
                  <div className="border-t border-surface my-2" />
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors text-left"
                    >
                      <LogOut className="h-5 w-5 text-text-secondary" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Language Sub-menu */}
          {settingsView === 'language' && (
            <div>
              <button
                onClick={() => setSettingsView('main')}
                className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors w-full text-left border-b border-surface"
              >
                <ArrowLeft className="h-5 w-5 text-text-secondary" />
                <span className="font-medium">Back</span>
              </button>
              <div className="py-2">
                {['uz', 'en', 'ru'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setSettingsView('main');
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 text-sm transition-colors',
                      language === lang
                        ? 'bg-accent text-white'
                        : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                    )}
                  >
                    {lang === 'uz' && 'O\'zbek 🇺🇿'}
                    {lang === 'en' && 'English 🇬🇧'}
                    {lang === 'ru' && 'Russian 🇷🇺'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Sub-menu */}
          {settingsView === 'appearance' && (
            <div>
              <button
                onClick={() => setSettingsView('main')}
                className="flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-surface transition-colors w-full text-left border-b border-surface"
              >
                <ArrowLeft className="h-5 w-5 text-text-secondary" />
                <span className="font-medium">Back</span>
              </button>
              <div className="py-2">
                {[
                  { value: 'system', label: 'System', icon: Monitor },
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setAppearance(value);
                      setSettingsView('main');
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left',
                      appearance === value
                        ? 'bg-accent text-white'
                        : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
