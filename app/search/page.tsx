import React, { Suspense } from 'react';
import SearchClient from './SearchClient';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8"><div className="text-center text-text-secondary">Searching...</div></div>}>
      <SearchClient />
    </Suspense>
  );
}
