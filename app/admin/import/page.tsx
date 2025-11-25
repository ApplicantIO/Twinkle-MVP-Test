'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SetupTwinkleButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  const handleSetup = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/setup-twinkle', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Twinkle Creator setup complete!',
          data,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to setup Twinkle creator',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSetup}
        disabled={loading}
        className="w-full bg-accent hover:bg-accent/90"
      >
        {loading ? 'Setting up...' : 'Setup Official Twinkle Creator'}
      </Button>

      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.success
              ? 'bg-green-500/20 border border-green-500 text-green-400'
              : 'bg-error/20 border border-error text-error'
          }`}
        >
          <p className="font-semibold">{result.success ? '✅ Success' : '❌ Error'}</p>
          <p className="mt-1">{result.message}</p>
          {result.success && result.data && (
            <div className="mt-2 text-sm">
              <p>Creator: {result.data.creator.name} ({result.data.creator.email})</p>
              <p>Video: {result.data.video.title}</p>
              <p className="mt-2 text-xs opacity-75">
                Login: official@twinkle.uz / twinkle2024
              </p>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-text-secondary">
        This will create the Official Twinkle Creator account and upload twinkle-video.mp4 from the project root.
      </p>
    </div>
  );
}

export default function ImportPage() {
  const [channelUrl, setChannelUrl] = useState('https://www.youtube.com/@ozimizuz');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  const handleImport = async () => {
    if (!channelUrl.trim()) {
      setResult({ success: false, message: 'Please enter a YouTube channel URL' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/import-youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Successfully imported ${data.imported} videos!`,
          data,
        });
        setChannelUrl('');
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to import channel',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6 text-text-primary">Admin Tools</h1>
      
      <div className="space-y-8">
        {/* YouTube Import Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Import YouTube Creator</h2>
          <div className="space-y-2">
            <Label htmlFor="channelUrl" className="text-text-primary">
              YouTube Channel URL
            </Label>
            <Input
              id="channelUrl"
              type="text"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="https://www.youtube.com/@channelname"
              className="w-full"
            />
            <p className="text-sm text-text-secondary">
              Enter the full YouTube channel URL (e.g., https://www.youtube.com/@ozimizuz)
            </p>
          </div>

          <Button
            onClick={handleImport}
            disabled={loading || !channelUrl.trim()}
            className="w-full bg-accent hover:bg-accent/90"
          >
            {loading ? 'Importing...' : 'Import Channel'}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.success
                  ? 'bg-green-500/20 border border-green-500 text-green-400'
                  : 'bg-error/20 border border-error text-error'
              }`}
            >
              <p className="font-semibold">{result.success ? '✅ Success' : '❌ Error'}</p>
              <p className="mt-1">{result.message}</p>
              {result.success && result.data && (
                <div className="mt-2 text-sm">
                  <p>Creator: {result.data.creator.name}</p>
                  <p>Videos imported: {result.data.imported}</p>
                  <p>Videos skipped: {result.data.skipped}</p>
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-surface rounded-lg">
            <h3 className="text-sm font-semibold mb-2 text-text-primary">How it works:</h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-text-secondary">
              <li>Creates a creator account in Twinkle</li>
              <li>Imports up to 50 most recent videos</li>
              <li>Downloads profile images and video thumbnails</li>
              <li>Videos play via YouTube embed (no file download)</li>
            </ul>
          </div>
        </div>

        {/* Individual Videos Import Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Import Individual YouTube Videos</h2>
          <div className="space-y-2">
            <Label htmlFor="videoUrls" className="text-text-primary">
              YouTube Video URLs (one per line)
            </Label>
            <textarea
              id="videoUrls"
              rows={10}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary font-mono text-sm"
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID_1&#10;https://www.youtube.com/watch?v=VIDEO_ID_2&#10;..."
            />
            <p className="text-sm text-text-secondary">
              Enter YouTube video URLs, one per line. Each video will be imported with its creator.
            </p>
          </div>

          <Button
            onClick={async () => {
              const textarea = document.getElementById('videoUrls') as HTMLTextAreaElement;
              const urls = textarea.value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
              
              if (urls.length === 0) {
                alert('Please enter at least one video URL');
                return;
              }

              setLoading(true);
              setResult(null);

              try {
                const response = await fetch('/api/admin/import-videos', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ videoUrls: urls }),
                });

                const data = await response.json();

                if (response.ok) {
                  setResult({
                    success: true,
                    message: `Successfully imported ${data.imported} videos! ${data.skipped} skipped, ${data.failed} failed.`,
                    data,
                  });
                  textarea.value = '';
                } else {
                  setResult({
                    success: false,
                    message: data.error || 'Failed to import videos',
                  });
                }
              } catch (error) {
                setResult({
                  success: false,
                  message: error instanceof Error ? error.message : 'An error occurred',
                });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90"
          >
            {loading ? 'Importing Videos...' : 'Import Videos'}
          </Button>

          {result && result.data && result.data.errors && result.data.errors.length > 0 && (
            <div className="p-4 bg-error/20 border border-error rounded-lg">
              <p className="text-error font-semibold mb-2">Errors:</p>
              <ul className="list-disc list-inside text-sm text-error space-y-1">
                {result.data.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Twinkle Creator Setup Section */}
        <div className="p-4 bg-surface rounded-lg border-t border-surface pt-6">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Setup Official Twinkle Creator</h2>
          <SetupTwinkleButton />
        </div>
      </div>
    </div>
  );
}
