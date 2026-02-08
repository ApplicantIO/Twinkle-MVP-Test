'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Headphones, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function BottomNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: 'Podcast',
      href: '/podcast',
      icon: <Headphones className="h-5 w-5" />,
    },
    {
      label: 'Fanzone',
      href: '/fanzone',
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: 'Profile',
      href: user ? '/profile' : '/',
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-surface z-[400]">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          // Use label as key since labels are unique, even if hrefs might duplicate
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {item.icon}
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
