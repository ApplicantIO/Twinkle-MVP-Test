import { useState, useEffect } from 'react';

type LayoutPreference = 'list' | 'grid';

export function useLayoutPreference(defaultValue: LayoutPreference = 'list') {
  const [layout, setLayout] = useState<LayoutPreference>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('playlistLayout');
      return (saved === 'grid' || saved === 'list') ? saved : defaultValue;
    }
    return defaultValue;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('playlistLayout', layout);
    }
  }, [layout]);

  return [layout, setLayout] as const;
}

