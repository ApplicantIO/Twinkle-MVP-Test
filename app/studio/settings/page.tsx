'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function StudioSettingsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
      router.push('/');
      return;
    }
    if (user) {
      setName(user.name || '');
      setAboutText(user.aboutText || '');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      if (name) formData.append('name', name);
      if (aboutText) formData.append('aboutText', aboutText);
      if (profileImage) formData.append('profileImage', profileImage);
      if (bannerImage) formData.append('bannerImage', bannerImage);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        await refreshUser();
        alert('Profile updated successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6 text-text-primary">Channel Settings</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-error/20 border border-error rounded-lg text-sm text-error">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name" className="text-text-primary">Display Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your display name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="aboutText" className="text-text-primary">About</Label>
          <Textarea
            id="aboutText"
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            placeholder="Tell viewers about yourself"
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profileImage" className="text-text-primary">Profile Picture</Label>
          <Input
            id="profileImage"
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bannerImage" className="text-text-primary">Banner Image</Label>
          <Input
            id="bannerImage"
            type="file"
            accept="image/*"
            onChange={(e) => setBannerImage(e.target.files?.[0] || null)}
            className="cursor-pointer"
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={saving}
            className="bg-accent hover:bg-accent/90"
          >
            {saving ? 'Saving...' : 'Save Changes'}
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

