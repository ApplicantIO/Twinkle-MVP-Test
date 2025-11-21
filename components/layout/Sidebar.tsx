'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Headphones, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Sparkles, label: 'Daily', href: '/daily' },
    { icon: Headphones, label: 'Podcast', href: '/podcast' },
    { icon: Users, label: 'Fan Zone', href: '/fan-zone' },
  ];

  const creatorItems = user?.role === 'creator' || user?.role === 'admin' ? [
    { icon: Settings, label: 'Creator Studio', href: '/studio' },
  ] : [];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-background border-r border-surface pt-4 overflow-y-auto z-40">
      <nav className="px-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.disabled ? '#' : item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-surface text-text-primary"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary",
                item.disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
        
        {creatorItems.length > 0 && (
          <div className="pt-4 border-t border-surface mt-4">
            {creatorItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-surface text-accent"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}
