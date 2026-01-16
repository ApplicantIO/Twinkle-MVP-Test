'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="p-8">
        <div className="text-center text-text-secondary">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, show simple message
  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-6 text-text-primary">Subscriptions</h1>
        <div className="text-center py-12">
          <p className="text-text-secondary">Please log in to see your subscriptions</p>
        </div>
      </div>
    );
  }

  // Authenticated user: show subscriptions content
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
