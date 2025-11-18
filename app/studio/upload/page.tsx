'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload as UploadIcon } from 'lucide-react';

export default function StudioUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    router.push('/');
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
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('video', videoFile);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (category) formData.append('category', category);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        router.push('/studio/content');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to upload video');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload video';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6 text-text-primary">Upload Video</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-error/20 border border-error rounded-lg text-sm text-error">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title" className="text-text-primary">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-text-primary">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell viewers about your video"
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-text-primary">Category</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-surface bg-surface px-3 py-2 text-sm text-text-primary"
          >
            <option value="">Select a category</option>
            <option value="vlog">Vlog</option>
            <option value="podcast">Podcast</option>
            <option value="travel">Travel</option>
            <option value="education">Education</option>
            <option value="entertainment">Entertainment</option>
            <option value="tech">Technology</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video" className="text-text-primary">Video File *</Label>
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
              <span className="text-sm text-text-secondary">
                {videoFile.name}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="thumbnail" className="text-text-primary">Thumbnail (Optional)</Label>
          <div className="flex items-center gap-4">
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {thumbnailFile && (
              <span className="text-sm text-text-secondary">
                {thumbnailFile.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90"
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

