'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

export function MainContent({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const isWatchPage = pathname?.startsWith('/watch');

  // Mobile/Tablet: No sidebar margin (sidebar hidden)
  // Desktop: Adjust based on sidebar state
  const marginLeft = isWatchPage 
    ? 'lg:ml-16' 
    : (isCollapsed 
      ? 'lg:ml-16' 
      : 'lg:ml-52');

  return (
    <main
      className={cn(
        "flex-1 min-w-0 pt-16 pb-16 lg:pb-0 min-h-screen transition-all duration-300",
        marginLeft
      )}
    >
      {children}
    </main>
  );
}

