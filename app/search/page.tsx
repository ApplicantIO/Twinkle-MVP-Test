import React, { Suspense } from "react";
import type { Metadata } from "next";
import { generateSearchMetadata } from "@/lib/seo/metadata";
import SearchClient from "./SearchClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return generateSearchMetadata(q);
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <div className="text-center text-text-secondary">Searching...</div>
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
