'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

type AuthMode = 'login' | 'signup';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<'email' | 'code' | 'details'>('email');
  const [codeSent, setCodeSent] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  // Remove showConfirmPassword, use showPassword for both fields
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [loginError, setLoginError] = useState(''); // 'not-found' | 'invalid-password' | ''
  const [passwordError, setPasswordError] = useState(false);

  if (!isOpen) return null;

  // Update mode when initialMode changes (when different button clicked in header)
  if (mode !== initialMode) {
    setMode(initialMode);
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginError('');
    setPasswordError(false);
    setLoading(true);

    try {
      await signIn(email, password);
      onClose();
      router.push('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      // Determine if it's a login not found or password invalid error
      if (errorMessage.toLowerCase().includes('identifier') || errorMessage.toLowerCase().includes('not found')) {
        setLoginError('not-found');
        setTimeout(() => setLoginError(''), 2000);
      } else if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('invalid')) {
        setPasswordError(true);
        setTimeout(() => setPasswordError(false), 2000);
      } else {
        setError(errorMessage);
        setTimeout(() => setError(''), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // In production, you'd call an API to send a verification code to the email/phone
      // Here we simulate sending and reveal the verification input in the same window
      setCodeSent(true);
      setLastSentEmail(email);
      setVerifyStatus('idle');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = () => {
    // Simulate resend
    setCodeSent(true);
    setLastSentEmail(email);
    setVerifyStatus('idle');
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // In a real app you'd verify the code via API; here we simulate verification
      if (!emailCode || emailCode.trim().length === 0) {
        setVerifyStatus('error');
      } else {
        setVerifyStatus('success');
        // Auto-advance to details after a brief delay
        setTimeout(() => setSignupStep('details'), 1000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify code';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordMismatch(false);
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        setPasswordMismatch(true);
        setLoading(false);
        return;
      }

      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      await signUp(email, password, name || undefined);
      // Close on success
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      // Auto-dismiss error after 2s
      setTimeout(() => setError(''), 2000);
    } finally {
      setLoading(false);
    }
  };

  const showEmailVerificationView = (emailValue?: string) => {
    // Ensure modal stays in signup mode and show the verification input
    setMode('signup');
    if (emailValue) setEmail(emailValue);
    setSignupStep('email');
    setCodeSent(true);
    setVerifyStatus('idle');
    setEmailCode('');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setEmail('');
    setFirstName('');
    setLastName('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setEmailCode('');
    setError('');
    setSignupStep('email');
    setCodeSent(false);
    setShowPassword(false);
    // Xatoga sabab bo'lgan qator olib tashlandi
    setPasswordMismatch(false);
    setLoginError('');
    setPasswordError(false);
};

  

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-start justify-end pt-20 pr-4">
      <div className="w-full max-w-sm bg-background border border-surface rounded-lg shadow-xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {/* Modal Title */}
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </h2>
          {error && (
            <div className="p-3 mb-4 bg-error/20 border border-error rounded text-sm text-error">
              {error}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-identifier" className="text-text-primary">
                  Login
                </Label>
                <Input
                  id="login-identifier"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  placeholder="@username"
                  className={loginError === 'not-found' ? 'border-2 border-red-500' : ''}
                  required
                />
                {loginError === 'not-found' && (
                  <p className="mt-1 text-xs font-semibold text-red-600">Login does not exist</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-text-primary">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(false);
                    }}
                    className={passwordError ? 'border-2 border-red-500' : ''}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1 text-xs font-semibold text-red-600">Invalid password</p>
                )}
              </div>

              <div className="text-right">
                <a href="#" className="text-sm text-accent hover:underline">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <button
                type="button"
                onClick={() => onClose()}
                className="w-full text-sm text-text-secondary hover:text-text-primary mt-2"
              >
                Back
              </button>
            </form>
          )}

          {/* Signup Form - Email Step */}
          {mode === 'signup' && signupStep === 'email' && (
            <form onSubmit={handleSignupEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-text-primary">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEmail(v);
                    if (codeSent && v !== lastSentEmail) {
                      setVerifyStatus('idle');
                    }
                  }}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {!codeSent ? (
                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90"
                  disabled={loading}
                >
                  {loading ? 'Sending code...' : 'Send Verification Code'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-code-inline" className="text-text-primary">
                      Verification Code
                    </Label>
                    <Input
                      id="email-code-inline"
                      type="text"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      placeholder="Enter code"
                      className={`w-full ${
                        verifyStatus === 'success'
                          ? 'border-2 border-emerald-500'
                          : verifyStatus === 'error'
                          ? 'border-2 border-red-500'
                          : ''
                      }`}
                      required
                    />
                    {/* Inline status text below input */}
                    {verifyStatus === 'success' && (
                      <p className="mt-1 text-xs font-semibold text-emerald-600">✓ Verified</p>
                    )}
                    {verifyStatus === 'error' && (
                      <p className="mt-1 text-xs font-semibold text-red-600">Invalid code</p>
                    )}
                  </div>

                  <div className="text-sm text-text-secondary">
                    Didn't receive a code?{' '}
                    <button
                      type="button"
                      onClick={() => resendCode()}
                      className="text-accent hover:underline"
                    >
                      Resend
                    </button>
                  </div>

                  {/* Bottom action button: Verify if email unchanged since send, otherwise send verification */}
                  {codeSent && email === lastSentEmail ? (
                    <Button
                      type="button"
                      onClick={() => handleVerifyCode()}
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={loading}
                    >
                      {loading ? 'Sending code...' : 'Send Verification Code'}
                    </Button>
                  )}
                </div>
              )}
            </form>
          )}

          {/* Signup Form - Code Step is rendered inline in the Email step (codeSent state) */}

          {/* Signup Form - Details Step */}
          {mode === 'signup' && signupStep === 'details' && (
            <form onSubmit={handleSignupDetails} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="first-name" className="text-text-primary">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    required
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor="last-name" className="text-text-primary">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-username" className="text-text-primary">
                  Username
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none select-none">@</span>
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="username"
                    className="pl-7"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-text-primary">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordMismatch) setPasswordMismatch(false);
                      if (error) setError('');
                    }}
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-text-primary">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordMismatch) setPasswordMismatch(false);
                      if (error) setError('');
                    }}
                    placeholder="Confirm your password"
                    className={passwordMismatch ? 'border-2 border-red-500' : ''}
                    required
                  />
                  {/* No separate icon, controlled by showPassword */}
                </div>
                {passwordMismatch && (
                  <p className="mt-1 text-xs font-semibold text-red-600">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
              <button
                type="button"
                onClick={() => showEmailVerificationView()}
                className="w-full text-sm text-text-secondary hover:text-text-primary mt-2"
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
