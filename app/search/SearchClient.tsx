'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Video, Playlist } from '@/types';
import { Play } from 'lucide-react';
import PlaylistCard from '@/components/ui/PlaylistCard';
import { getAllPlaylists } from '@/data/mockData';

export default function SearchClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPlaylist, setHoveredPlaylist] = useState<string | null>(null);

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setVideos([]);
        setPlaylists([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/videos?search=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setVideos(data.videos || []);
        }
        
        // Search playlists (simple title/description match)
        const allPlaylists = getAllPlaylists();
        const filteredPlaylists = allPlaylists.filter(p => 
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.description?.toLowerCase().includes(query.toLowerCase()) ||
          p.creatorName.toLowerCase().includes(query.toLowerCase())
        );
        setPlaylists(filteredPlaylists);
      } catch (error) {
        console.error('Error searching videos:', error);
      } finally {
        setLoading(false);
      }
    }
    performSearch();
  }, [query]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-text-secondary">Searching...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-6 text-text-primary">
        Search results for &quot;{query}&quot;
      </h1>
      
      {playlists.length === 0 && videos.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p>No results found matching your search.</p>
        </div>
      ) : (
        <>
          {/* Playlists Results */}
          {playlists.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-text-primary">Playlists</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    hoveredPlaylist={hoveredPlaylist}
                    setHoveredPlaylist={setHoveredPlaylist}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Videos Results */}
          {videos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-text-primary">Videos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-video bg-surface rounded-lg overflow-hidden mb-2">
                      {video.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-12 w-12 text-text-secondary" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-sm text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1">
                      {video.user?.name || 'Unknown Creator'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {video.views.toLocaleString()} views
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
