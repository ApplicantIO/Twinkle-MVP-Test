'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_COOKIE_NAME = 'twinkle_token';
const AUTH_COOKIE_MAX_AGE_DAYS = 7;

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60}; SameSite=Lax`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      clearAuthCookie();
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAuthCookie(token);
      } else {
        localStorage.removeItem('token');
        clearAuthCookie();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      clearAuthCookie();
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (identifier: string, password: string) => {
    try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
        let errorMessage = 'Failed to sign in';
        try {
      const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }
      
    localStorage.setItem('token', data.token);
    setAuthCookie(data.token);

    // Immediately fetch fresh user data from backend to ensure we have latest profile
    try {
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      } else {
        // Fallback to user from signin response if /me fails
        setUser(data.user);
      }
    } catch (fetchError) {
      // Fallback to user from signin response if fetch fails
      console.error('Failed to fetch fresh user data:', fetchError);
    setUser(data.user);
    }
    } catch (error) {
      // Re-throw with better error message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sign up');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    setAuthCookie(data.token);

    // Immediately fetch fresh user data from backend to ensure we have latest profile
    try {
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      } else {
        // Fallback to user from signup response if /me fails
        setUser(data.user);
      }
    } catch (fetchError) {
      // Fallback to user from signup response if fetch fails
      console.error('Failed to fetch fresh user data:', fetchError);
    setUser(data.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    clearAuthCookie();

    // Clear all sessionStorage items
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
    
    // Reset user state to null
    setUser(null);
    
    // Use Next.js router for client-side navigation (preserves React state flow)
    router.push('/');
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
