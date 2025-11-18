'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect only after auth finished loading
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="p-8">
        <div className="text-center text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6 text-text-primary">Subscriptions</h1>
      
      <div className="text-center py-12 text-text-secondary">
        <p className="mb-2">Subscriptions feature is coming soon!</p>
        <p className="text-sm">This feature will be available in a future update.</p>
      </div>
    </div>
  );
}
