'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

export function MainContent({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const isWatchPage = pathname?.startsWith('/watch');

  // On watch page, always use collapsed sidebar width (overlay mode)
  // On other pages, adjust based on sidebar state
  const marginLeft = isWatchPage ? 'ml-16' : (isCollapsed ? 'ml-16' : 'ml-52');

  return (
    <main
      className={cn(
        "pt-16 min-h-screen transition-all duration-300",
        marginLeft
      )}
    >
      {children}
    </main>
  );
}

