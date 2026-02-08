'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useModal } from '@/contexts/ModalContext';
import { MobileMenu } from './MobileMenu';
import { HeaderSearch } from './HeaderSearch';
import { HeaderProfileMenu } from './HeaderProfileMenu';

export function Header() {
  const { user, logout } = useAuth();
  const { setIsCollapsed, isCollapsed } = useSidebar();
  const { openAuthModal } = useModal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header id="app-header" className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-surface z-[1000] flex items-center px-4">
      {/* Desktop: Menu Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex items-center justify-center h-10 w-10 mr-3 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </Button>

      {/* Logo - Always visible */}
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xl lg:text-2xl font-bold text-accent">Twinkle</span>
      </Link>

      {/* Centered search bar */}
      <HeaderSearch />

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

      {/* Right side actions - Desktop only */}
      <div className="hidden lg:flex ml-auto items-center gap-2 flex-shrink-0 min-w-0">
        {user ? (
          <HeaderProfileMenu user={user} onLogout={logout} />
        ) : (
          <>
          <div className="flex gap-2">
            <Button
              variant="ghost"
                onClick={() => openAuthModal('signin')}
              className="text-text-secondary hover:text-text-primary"
            >
              Sign In
            </Button>
            <Button
                onClick={() => openAuthModal('signup')}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              Sign Up
            </Button>
          </div>
            <HeaderProfileMenu user={null} onLogout={() => {}} />
          </>
        )}
      </div>

      {/* Mobile Menu Slide-out */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
}
