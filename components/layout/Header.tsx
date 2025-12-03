'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Upload, User, LogOut, Settings, Globe, Palette, Monitor, Sun, Moon, MessageSquare, HelpCircle, ArrowLeft, Menu, CreditCard, ArrowRight, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import AuthModal from '@/components/AuthModal';
import { MobileMenu } from './MobileMenu';
import { cn } from '@/lib/utils';

// Mock user object for simulated logged-in state
const MOCK_USER = {
  email: 'yupbekha@gmail.com',
  firstName: 'Behruz',
  lastName: 'Sayfiddinov',
  username: 'yupbekha',
  avatar: null, // Will use user initial as placeholder
};

export function Header() {
  const { user, logout } = useAuth();
  const { setIsCollapsed, isCollapsed } = useSidebar();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [language, setLanguage] = useState('en');
  const [appearance, setAppearance] = useState('system');
  const [settingsView, setSettingsView] = useState<'main' | 'language' | 'appearance' | 'switchAccount'>('main');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Use actual user role if available, otherwise default to viewer
  const userRole = (user?.role as 'viewer' | 'creator' | 'admin') || 'viewer';
  
  // Mock secondary account
  const mockSecondaryAccount = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Close the dropdown menu
    setIsSettingsOpen(false);
    // Call the actual logout function
    logout();
    router.push('/');
  };

  const handleSwitchAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Switch to account switch view instead of closing
    setSettingsView('switchAccount');
  };


  const handleAccountSelect = (accountEmail: string) => {
    // Mock account switch - just reset to main view
    setSettingsView('main');
    console.log('Switched to account:', accountEmail);
  };

  const handleAddAccount = () => {
    // Mock add account - reset to main view
    setSettingsView('main');
    console.log('Add account clicked');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-surface z-50 flex items-center px-4">
      {/* Desktop: Menu Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:block mr-3 text-text-secondary hover:text-text-primary hover:bg-surface"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo - Always visible */}
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xl lg:text-2xl font-bold text-accent">Twinkle</span>
      </Link>

      {/* Centered search bar - Responsive */}
      {/* Desktop/Large: 30% width search bar */}
      <form 
        onSubmit={(e) => {
          handleSearch(e);
          setIsSearchExpanded(false);
        }} 
        className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: '30%', minWidth: '200px', maxWidth: '400px' }}
      >
        <div className="relative">
          <Input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-12 bg-surface border border-gray-700 text-text-primary placeholder:text-text-secondary rounded-full h-10 focus:border-gray-600 w-full"
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

      {/* Mobile: Search removed - only logo and menu icon visible */}
      {/* Search functionality moved to mobile menu */}

      {/* Mobile Menu Button (only on mobile/tablet) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden ml-auto text-text-secondary hover:text-text-primary hover:bg-surface"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Right side actions - Desktop only, Fixed width container to prevent overlap */}
      <div className="hidden lg:flex ml-auto items-center gap-2 flex-shrink-0 min-w-0">
        {user ? (
          <>
            {/* User Profile Button - Opens Settings Modal */}
            <DropdownMenu 
              open={isSettingsOpen} 
              onOpenChange={(open) => {
                if (open !== isSettingsOpen) {
                  setIsSettingsOpen(open);
                  if (!open) {
                    // Reset to main view when closing
                    setSettingsView('main');
                    // Remove focus from button when dropdown closes
                    setTimeout(() => {
                      profileButtonRef.current?.blur();
                    }, 0);
                  }
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  ref={profileButtonRef}
                  className="flex items-center gap-2.5 pl-3 pr-1 h-10 rounded-full bg-surface border border-transparent hover:border-gray-500 transition-colors focus:outline-none"
                >
                  {/* First Name */}
                  <span className="text-sm font-medium text-text-primary">
                    {MOCK_USER.firstName}
                  </span>
                  {/* Avatar */}
                  {MOCK_USER.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={MOCK_USER.avatar}
                      alt={MOCK_USER.firstName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white font-medium text-sm">
                      {MOCK_USER.firstName.charAt(0)}
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface border-surface w-56">
            {settingsView === 'main' && (
              <>
                {/* Group 1: Account Actions */}
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
                    handleSwitchAccount(e as any);
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

                {/* Group 2: Creator Tools */}
                <DropdownMenuItem
                  onClick={() => router.push('/become-creator')}
                  className="text-text-primary hover:bg-background cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2" />
                  Become Creator
                </DropdownMenuItem>
                
                {/* Twinkle Studio - Only show if user is creator or admin */}
                {(userRole === 'creator' || userRole === 'admin') && (
                  <DropdownMenuItem
                    onClick={() => {
                      router.push('/studio');
                    }}
                    className="text-text-primary hover:bg-background cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Twinkle Studio
                  </DropdownMenuItem>
                )}
                
                <div className="border-t border-gray-700 my-1" />

                {/* Group 3: App Settings */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSettingsView('language');
                    // Keep menu open
                    setIsSettingsOpen(true);
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer flex justify-between"
                >
                  <div className="flex gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Language</span>
                  </div>
                  <span className="text-xs text-text-secondary">{language.toUpperCase()}</span>
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
                    {appearance === 'system' ? <Monitor className="h-3 w-3" /> : appearance === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                  </span>
                </DropdownMenuItem>
                
                <div className="border-t border-gray-700 my-1" />

                {/* Group 4: Support */}
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
                    e.stopPropagation();
                    setLanguage('en');
                    setSettingsView('main');
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
                    e.stopPropagation();
                    setLanguage('ru');
                    setSettingsView('main');
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
                    e.stopPropagation();
                    setAppearance('light');
                    setSettingsView('main');
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
                    e.stopPropagation();
                    setAppearance('dark');
                    setSettingsView('main');
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
                
                {/* Currently logged-in account */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAccountSelect(MOCK_USER.email);
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                    {MOCK_USER.firstName.charAt(0)}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary">
                      {MOCK_USER.firstName} {MOCK_USER.lastName}
                    </span>
                    <span className="text-xs text-text-secondary truncate">
                      {MOCK_USER.email}
                    </span>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                </DropdownMenuItem>
                
                {/* Secondary account */}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAccountSelect(mockSecondaryAccount.email);
                  }}
                  className="text-text-primary hover:bg-background cursor-pointer flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                    {mockSecondaryAccount.firstName.charAt(0)}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary">
                      {mockSecondaryAccount.firstName} {mockSecondaryAccount.lastName}
                    </span>
                    <span className="text-xs text-text-secondary truncate">
                      {mockSecondaryAccount.email}
                    </span>
                  </div>
                </DropdownMenuItem>
                
                <div className="border-t border-gray-700 my-1" />
                
                {/* Add Account button */}
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
          </>
        ) : (
          <>
            {/* Sign In and Sign Up buttons when not logged in */}
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

            {/* Settings Dropdown - only shown when not logged in */}
            <DropdownMenu 
              open={isSettingsOpen} 
              onOpenChange={(open) => {
                if (open !== isSettingsOpen) {
                  setIsSettingsOpen(open);
                  if (!open) {
                    setSettingsView('main');
                  }
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
                <div className="border-t border-gray-700 my-1" />

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
          </>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authModalMode} />
      
      {/* Mobile Menu Slide-out */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
}
