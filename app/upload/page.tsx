'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createVideo } from '@/lib/firebase/videos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload as UploadIcon } from 'lucide-react';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    setUploading(true);

    try {
      await createVideo(
        title,
        description,
        videoFile,
        thumbnailFile,
        user.id,
        user.name || user.email || 'Unknown',
        user.profileImageUrl || undefined
      );
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload video';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Upload Video</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-600/20 border border-red-600 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell viewers about your video"
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="video">Video File *</Label>
          <div className="flex items-center gap-4">
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              required
              className="cursor-pointer"
            />
            {videoFile && (
              <span className="text-sm text-muted-foreground">
                {videoFile.name}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="thumbnail">Thumbnail (Optional)</Label>
          <div className="flex items-center gap-4">
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {thumbnailFile && (
              <span className="text-sm text-muted-foreground">
                {thumbnailFile.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <UploadIcon className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Video'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

