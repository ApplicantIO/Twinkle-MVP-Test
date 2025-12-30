'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface PurchaseContextType {
  purchasedPlaylists: string[];
  purchasedVideos: string[];
  checkPlaylistPurchased: (playlistId: string) => boolean;
  checkVideoPurchased: (videoId: string) => boolean;
  refreshPurchases: () => void;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [purchasedPlaylists, setPurchasedPlaylists] = useState<string[]>([]);
  const [purchasedVideos, setPurchasedVideos] = useState<string[]>([]);

  const loadPurchases = useCallback(() => {
    if (typeof window !== 'undefined') {
      const playlists = JSON.parse(localStorage.getItem('purchasedPlaylists') || '[]');
      const videos = JSON.parse(localStorage.getItem('purchasedVideos') || '[]');
      setPurchasedPlaylists(playlists);
      setPurchasedVideos(videos);
    }
  }, []);

  useEffect(() => {
    // Load initial state
    loadPurchases();

    // Listen for purchase events
    const handlePurchaseEvent = () => {
      loadPurchases();
    };

    window.addEventListener('playlistPurchased', handlePurchaseEvent);
    window.addEventListener('videoPurchased', handlePurchaseEvent);
    window.addEventListener('storage', handlePurchaseEvent);

    return () => {
      window.removeEventListener('playlistPurchased', handlePurchaseEvent);
      window.removeEventListener('videoPurchased', handlePurchaseEvent);
      window.removeEventListener('storage', handlePurchaseEvent);
    };
  }, [loadPurchases]);

  const checkPlaylistPurchased = useCallback((playlistId: string): boolean => {
    return purchasedPlaylists.includes(playlistId);
  }, [purchasedPlaylists]);

  const checkVideoPurchased = useCallback((videoId: string): boolean => {
    return purchasedVideos.includes(videoId);
  }, [purchasedVideos]);

  const refreshPurchases = useCallback(() => {
    loadPurchases();
  }, [loadPurchases]);

  return (
    <PurchaseContext.Provider
      value={{
        purchasedPlaylists,
        purchasedVideos,
        checkPlaylistPurchased,
        checkVideoPurchased,
        refreshPurchases,
      }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase() {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
}

