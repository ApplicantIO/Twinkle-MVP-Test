'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Eye, EyeOff, Check, XCircle } from 'lucide-react';
import { useEffect, useRef, useCallback } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

type AuthMode = 'login' | 'signup';
type ViewMode = 'login' | 'signup' | 'forgotPassword';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const resetEmailRef = useRef<HTMLInputElement>(null);
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
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loginErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const passwordErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const verifyAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const signupErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetPasswordTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset form fields and validation state (used when switching modes)
  const resetFormState = useCallback(() => {
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
    setPasswordMismatch(false);
    setLoginError('');
    setPasswordError(false);
    setEmailTaken(false);
    setCheckingEmail(false);
    setUsernameTaken(false);
    setCheckingUsername(false);
    setUsernameAvailable(null);
    setResendCooldown(0);
    setVerifyStatus('idle');
    setResetLinkSent(false);
    // Clear any pending timers
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
      emailCheckTimeoutRef.current = null;
    }
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
      usernameCheckTimeoutRef.current = null;
    }
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
      resendTimerRef.current = null;
    }
  }, []);

  // Update mode when initialMode changes (when different button clicked in header)
  // Bug fix: Move state setters to useEffect to avoid calling during render
  // Bug fix: Clear form fields when switching modes to prevent data persistence
  useEffect(() => {
    if (mode !== initialMode) {
      // Reset all form fields and validation state before switching modes
      resetFormState();
      setMode(initialMode);
      setViewMode(initialMode);
    }
  }, [initialMode, mode, resetFormState]);

  // Auto-focus email input when switching to forgot password view
  useEffect(() => {
    if (!isOpen) return;
    if (viewMode === 'forgotPassword' && resetEmailRef.current) {
      // Bug fix: Store timeout in ref for cleanup
      focusTimeoutRef.current = setTimeout(() => {
        resetEmailRef.current?.focus();
      }, 100);
    }
    // Cleanup focus timeout
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
    };
  }, [viewMode, isOpen]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
      }
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      if (loginErrorTimeoutRef.current) {
        clearTimeout(loginErrorTimeoutRef.current);
      }
      if (passwordErrorTimeoutRef.current) {
        clearTimeout(passwordErrorTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      if (verifyAdvanceTimeoutRef.current) {
        clearTimeout(verifyAdvanceTimeoutRef.current);
      }
      if (signupErrorTimeoutRef.current) {
        clearTimeout(signupErrorTimeoutRef.current);
      }
      if (resetPasswordTimeoutRef.current) {
        clearTimeout(resetPasswordTimeoutRef.current);
      }
    };
  }, []);

  // Real-time email validation (debounced)
  const checkEmailAvailability = useCallback(async (emailValue: string) => {
    if (!emailValue || !emailValue.includes('@')) {
      setEmailTaken(false);
      return;
    }

    setCheckingEmail(true);
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmailTaken(data.exists);
      }
    } catch (error) {
      console.error('Email check error:', error);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  // Debounced email check on blur or after 500ms
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }
    
    if (codeSent && value !== lastSentEmail) {
      setVerifyStatus('idle');
    }

    if (value && value.includes('@')) {
      emailCheckTimeoutRef.current = setTimeout(() => {
        checkEmailAvailability(value);
      }, 500);
    } else {
      setEmailTaken(false);
    }
  };

  const handleEmailBlur = () => {
    if (email && email.includes('@')) {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
      checkEmailAvailability(email);
    }
  };

  // Real-time username validation (debounced)
  const checkUsernameAvailability = useCallback(async (usernameValue: string) => {
    const normalized = usernameValue.trim().startsWith('@') 
      ? usernameValue.trim().slice(1) 
      : usernameValue.trim();

    if (!normalized || normalized.length < 2) {
      setUsernameTaken(false);
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalized }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsernameTaken(data.exists);
        setUsernameAvailable(!data.exists);
      }
    } catch (error) {
      console.error('Username check error:', error);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Debounced username check
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }
    
    if (error) setError('');

    const normalized = value.trim().startsWith('@') 
      ? value.trim().slice(1) 
      : value.trim();

    if (normalized && normalized.length >= 2) {
      usernameCheckTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
    } else {
      setUsernameTaken(false);
      setUsernameAvailable(null);
    }
  };

  // Resend code with cooldown timer
  const resendCode = useCallback(() => {
    setCodeSent(true);
    setLastSentEmail(email);
    setVerifyStatus('idle');
    setResendCooldown(60);

    // Clear any existing timer
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
    }

    // Start countdown timer
    resendTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendTimerRef.current) {
            clearInterval(resendTimerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [email]);

  if (!isOpen) return null;

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
      // Bug fix: Store timeouts in refs for proper cleanup
      if (errorMessage.toLowerCase().includes('identifier') || errorMessage.toLowerCase().includes('not found')) {
        setLoginError('not-found');
        if (loginErrorTimeoutRef.current) clearTimeout(loginErrorTimeoutRef.current);
        loginErrorTimeoutRef.current = setTimeout(() => setLoginError(''), 2000);
      } else if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('invalid')) {
        setPasswordError(true);
        if (passwordErrorTimeoutRef.current) clearTimeout(passwordErrorTimeoutRef.current);
        passwordErrorTimeoutRef.current = setTimeout(() => setPasswordError(false), 2000);
      } else {
        setError(errorMessage);
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => setError(''), 2000);
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
        // Bug fix: Store timeout in ref for proper cleanup
        if (verifyAdvanceTimeoutRef.current) clearTimeout(verifyAdvanceTimeoutRef.current);
        verifyAdvanceTimeoutRef.current = setTimeout(() => setSignupStep('details'), 1000);
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

      // Use username if provided (strip @ prefix if user typed it), otherwise use first/last name combination
      const normalizedUsername = username.trim().startsWith('@') 
        ? username.trim().slice(1) 
        : username.trim();
      const displayName = normalizedUsername || `${firstName.trim()} ${lastName.trim()}`.trim();
      await signUp(email, password, displayName || undefined);
      // Close on success
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      // Auto-dismiss error after 2s
      // Bug fix: Store timeout in ref for proper cleanup
      if (signupErrorTimeoutRef.current) clearTimeout(signupErrorTimeoutRef.current);
      signupErrorTimeoutRef.current = setTimeout(() => setError(''), 2000);
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
    // Reset form state before switching
    resetFormState();
    setMode(newMode);
    setViewMode(newMode);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setViewMode('forgotPassword');
    setError('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // In production, you'd call an API to send a reset link
      // For now, we'll simulate success
      setResetLinkSent(true);
      setError('');
      // Auto-return to login after showing success
      // Bug fix: Store timeout in ref for proper cleanup
      if (resetPasswordTimeoutRef.current) clearTimeout(resetPasswordTimeoutRef.current);
      resetPasswordTimeoutRef.current = setTimeout(() => {
        setViewMode('login');
        setEmail('');
        setResetLinkSent(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset link';
      setError(errorMessage);
      setResetLinkSent(false);
    } finally {
      setLoading(false);
    }
};

  

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-40 flex items-start justify-end pt-20 pr-4"
      onClick={(e) => {
        // Close modal when clicking on the overlay (background)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
          className="w-full max-w-sm bg-background border border-surface rounded-lg shadow-xl relative transition-opacity duration-200"
        onClick={(e) => {
          // Prevent closing when clicking inside the modal
          e.stopPropagation();
        }}
      >
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary transition-opacity duration-200">
              {viewMode === 'forgotPassword' ? 'Reset Password' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </h2>
          </div>
          {error && (
            <div className="p-3 mb-4 bg-rose-50 text-rose-700 border border-rose-100 rounded text-sm transition-opacity duration-200">
              {error}
            </div>
          )}
          
          {/* Content with fade transition */}
          <div className="transition-opacity duration-200">

          {/* Forgot Password View */}
          {viewMode === 'forgotPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetLinkSent ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-sm">
                    Reset link sent! Check your email for instructions.
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('login');
                      setEmail('');
                      setError('');
                      setResetLinkSent(false);
                    }}
                    className="w-full text-sm text-text-secondary hover:text-text-primary mt-2"
                  >
                    Back
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-text-secondary mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-text-primary">
                      Email
                    </Label>
                    <Input
                      ref={resetEmailRef}
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('login');
                      setEmail('');
                      setError('');
                      setResetLinkSent(false);
                    }}
                    className="w-full text-sm text-text-secondary hover:text-text-primary mt-2"
                  >
                    Back
                  </button>
                </>
              )}
            </form>
          )}

          {/* Login Form */}
          {mode === 'login' && viewMode === 'login' && (
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
                  className={loginError === 'not-found' ? 'border-2 border-rose-300' : ''}
                  required
                />
                {loginError === 'not-found' && (
                  <p className="mt-1 text-xs font-semibold text-rose-700">Login does not exist</p>
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
                    className={passwordError ? 'border-2 border-rose-300' : ''}
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
                  <p className="mt-1 text-xs font-semibold text-rose-700">Invalid password</p>
                )}
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-accent hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}

          {/* Signup Form - Email Step */}
          {mode === 'signup' && signupStep === 'email' && (
            <form onSubmit={handleSignupEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-text-primary">
                  Email
                </Label>
                <div className="relative">
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={handleEmailBlur}
                  placeholder="you@example.com"
                    className={emailTaken ? 'border-2 border-rose-500' : ''}
                  required
                />
                  {checkingEmail && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {emailTaken && (
                  <p className="mt-1 text-xs font-semibold text-rose-700">This email is already taken</p>
                )}
              </div>

              {!codeSent ? (
                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90"
                  disabled={loading || emailTaken || checkingEmail}
                >
                  {loading ? 'Signing up...' : 'Sign Up'}
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
                          ? 'border-2 border-emerald-300'
                          : verifyStatus === 'error'
                          ? 'border-2 border-rose-300'
                          : ''
                      }`}
                      required
                    />
                    {/* Inline status text below input */}
                    {verifyStatus === 'success' && (
                      <p className="mt-1 text-xs font-semibold text-emerald-700">✓ Verified</p>
                    )}
                    {verifyStatus === 'error' && (
                      <p className="mt-1 text-xs font-semibold text-rose-700">Invalid code</p>
                    )}
                  </div>

                  <div className="text-sm text-text-secondary">
                    Didn't receive a code?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        if (resendCooldown === 0) {
                          resendCode();
                        }
                      }}
                      disabled={resendCooldown > 0}
                      className="text-accent hover:underline disabled:text-text-secondary disabled:no-underline disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
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
                      disabled={loading || emailTaken || checkingEmail}
                    >
                      {loading ? 'Sending code...' : 'Sign Up'}
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
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="username"
                    className={`pl-7 pr-10 ${usernameTaken ? 'border-2 border-rose-300' : usernameAvailable ? 'border-2 border-emerald-300' : ''}`}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername && (
                      <div className="w-4 h-4 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
                    )}
                    {!checkingUsername && usernameTaken && (
                      <XCircle className="h-4 w-4 text-rose-500" />
                    )}
                    {!checkingUsername && usernameAvailable && (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
                {usernameTaken && (
                  <p className="mt-1 text-xs font-semibold text-rose-700">This username is already taken</p>
                )}
                {usernameAvailable && !checkingUsername && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">Username is available</p>
                )}
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
                    className={passwordMismatch ? 'border-2 border-rose-300' : ''}
                    required
                  />
                  {/* No separate icon, controlled by showPassword */}
                </div>
                {passwordMismatch && (
                  <p className="mt-1 text-xs font-semibold text-rose-700">Passwords do not match</p>
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
    </div>
  );
}
