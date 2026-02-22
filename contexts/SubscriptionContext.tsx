'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionContextType {
  isSubscribedTo: (creatorId: string) => boolean;
  refreshSubscriptions: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscribedCreatorIds, setSubscribedCreatorIds] = useState<Set<string>>(new Set());

  const loadSubscriptions = useCallback(() => {
    if (!user) {
      setSubscribedCreatorIds(new Set());
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setSubscribedCreatorIds(new Set());
      return;
    }
    fetch('/api/subscriptions/creators', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : { creators: [] }))
      .then((data: { creators?: { id: string }[] }) => {
        const ids = new Set((data.creators ?? []).map((c) => c.id));
        setSubscribedCreatorIds(ids);
      })
      .catch(() => setSubscribedCreatorIds(new Set()));
  }, [user]);

  useEffect(() => {
    loadSubscriptions();

    const handleSubscriptionsUpdated = () => {
      loadSubscriptions();
    };

    window.addEventListener('subscriptionsUpdated', handleSubscriptionsUpdated);
    return () => window.removeEventListener('subscriptionsUpdated', handleSubscriptionsUpdated);
  }, [loadSubscriptions]);

  const isSubscribedTo = useCallback(
    (creatorId: string): boolean => {
      return subscribedCreatorIds.has(creatorId);
    },
    [subscribedCreatorIds]
  );

  const refreshSubscriptions = useCallback(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribedTo,
        refreshSubscriptions,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
