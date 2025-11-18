'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const DEMO_USER = { email: 'demo@user.local', password: 'password123' };
  const DEMO_ADMIN = { email: 'admin@twinkle.local', password: 'adminpass123' };

  const signInAsDemo = async (creds: { email: string; password: string }) => {
    setError('');
    setLoading(true);
    try {
      await signIn(creds.email, creds.password);
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in demo account';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-3xl font-bold text-accent">Twinkle</Link>
          <h1 className="text-2xl font-semibold mt-4 text-text-primary">Sign In</h1>
          <p className="text-text-secondary mt-2">Sign in to your account</p>
        </div>
        {/* Demo credentials quick-actions */}
        <div className="mb-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_USER.email);
              setPassword(DEMO_USER.password);
            }}
            className="px-3 py-1 text-sm rounded bg-surface border border-surface text-text-primary hover:bg-surface/90"
          >
            Fill Demo User
          </button>
          <button
            type="button"
            onClick={() => signInAsDemo(DEMO_USER)}
            className="px-3 py-1 text-sm rounded bg-accent text-white hover:bg-accent/90"
            disabled={loading}
          >
            Sign In as Demo User
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_ADMIN.email);
              setPassword(DEMO_ADMIN.password);
            }}
            className="px-3 py-1 text-sm rounded bg-surface border border-surface text-text-primary hover:bg-surface/90"
          >
            Fill Demo Admin
          </button>
          <button
            type="button"
            onClick={() => signInAsDemo(DEMO_ADMIN)}
            className="px-3 py-1 text-sm rounded bg-accent text-white hover:bg-accent/90"
            disabled={loading}
          >
            Sign In as Demo Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-surface p-6 rounded-lg border border-surface">
          {error && (
            <div className="p-3 bg-error/20 border border-error rounded text-sm text-error">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-text-primary">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-text-primary">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-accent hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
