/**
 * @fileoverview Login Page
 * @module app/(auth)/login
 * 
 * OVERVIEW:
 * User login page with email/password authentication.
 * Integrates with NextAuth credentials provider.
 * 
 * @created 2025-11-21
 * @author ECHO v1.1.0
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, CardBody, Divider, Link } from '@heroui/react';

/**
 * LoginForm - Internal component that uses useSearchParams
 * Wrapped in Suspense boundary by parent component
 */
function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Map NextAuth error codes to user-friendly messages
  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'Configuration': 'Server configuration error. Please try again later.',
      'AccessDenied': 'Access denied. Please check your credentials.',
      'Verification': 'Verification failed. Please try again.',
      'CredentialsSignin': 'Invalid email or password.',
      'SessionRequired': 'Please sign in to continue.',
      'OAuthSignin': 'Error during sign in. Please try again.',
      'OAuthCallback': 'Error during sign in callback.',
      'OAuthCreateAccount': 'Could not create account.',
      'EmailCreateAccount': 'Could not create account.',
      'Callback': 'Error during callback.',
      'OAuthAccountNotLinked': 'Account not linked.',
      'EmailSignin': 'Check your email for sign in link.',
      'Default': 'An error occurred. Please try again.',
    };
    return errorMessages[errorCode] || errorMessages['Default'];
  };

  // Auto-restore email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('loginEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    // Show NextAuth error message from query string, if present
    const qsError = search?.get('error');
    if (qsError) {
      setError(getErrorMessage(qsError));
    }
    
    // Auto-focus email field
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    if (emailInput) {
      setTimeout(() => emailInput.focus(), 100);
    }
  }, []);

  const handleCapsLockCheck = (e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  const isFormValid = email.length > 0 && password.length > 0 && validateEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      setError('Please enter a valid email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Save email to localStorage if "Remember me" is checked
      if (rememberMe) {
        localStorage.setItem('loginEmail', email);
      } else {
        localStorage.removeItem('loginEmail');
      }

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        // Use server-provided error if available (e.g., registration incomplete)
        setError(result.error);
        setIsLoading(false);
      } else {
        // Show success animation
        setShowSuccess(true);
        
        // Wait for animation, then redirect
        setTimeout(() => {
          router.push('/game');
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid && !isLoading) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Success Animation */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-8 rounded-2xl border border-white/20 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center animate-bounce">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-white">Welcome back!</p>
              <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
            </div>
          </div>
        </div>
      )}

      <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
        <CardBody className="gap-6 p-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-slate-400">
              Sign in to continue your journey
            </p>
          </div>

          <Divider className="bg-white/10" />

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" onKeyPress={handleKeyPress}>
            {/* Email Input */}
            <div className="relative">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onValueChange={setEmail}
                isRequired
                isDisabled={isLoading}
                variant="bordered"
                autoComplete="email"
                aria-label="Email address"
                classNames={{
                  input: 'text-white [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white]',
                  inputWrapper: 'border-white/20 bg-white/5 hover:border-white/30',
                }}
                endContent={
                  email.length > 0 && (
                    <div className="flex items-center">
                      {validateEmail(email) ? (
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  )
                }
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onValueChange={setPassword}
                onKeyUp={handleCapsLockCheck}
                onKeyDown={handleCapsLockCheck}
                isRequired
                isDisabled={isLoading}
                variant="bordered"
                autoComplete="current-password"
                aria-label="Password"
                classNames={{
                  input: 'text-white [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white]',
                  inputWrapper: 'border-white/20 bg-white/5 hover:border-white/30',
                }}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                }
              />
              
              {/* Caps Lock Warning */}
              {capsLockOn && password.length > 0 && (
                <div className="mt-1 flex items-center gap-1 text-yellow-400 text-xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Caps Lock is ON</span>
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                />
                <span>Remember me</span>
              </label>
              
              <Link 
                href="/forgot-password" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300"
              size="lg"
              isLoading={isLoading}
              isDisabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Enter Hint */}
            {isFormValid && !isLoading && (
              <p className="text-slate-500 text-xs text-center">
                Press <kbd className="px-2 py-1 text-xs font-semibold bg-slate-700 border border-slate-600 rounded">Enter ↵</kbd> to submit
              </p>
            )}
          </form>

          <Divider className="bg-white/10" />

          {/* Registration Link */}
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link 
                href="/register" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * LoginPage - User authentication page with Suspense wrapper
 * 
 * Features:
 * - Email/password credentials login
 * - Form validation with error states
 * - Loading states during submission
 * - Link to registration page
 * - Automatic redirect to dashboard on success
 * 
 * @returns Login page component wrapped in Suspense
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **NextAuth Integration**: Uses signIn() with credentials provider
 * 2. **Enhanced UX Features**:
 *    - Auto-focus email field on page load
 *    - Auto-restore email from localStorage (if "Remember me" was checked)
 *    - Password visibility toggle with eye icon
 *    - Real-time email validation with visual feedback (✓/✗)
 *    - Caps Lock warning on password field
 *    - "Remember me" checkbox to save email preference
 *    - "Forgot password?" link for account recovery
 *    - Success animation before redirect (1.5s delay)
 *    - Disabled inputs during submission to prevent duplicate requests
 *    - Enhanced error messages with icons
 *    - "Press Enter to submit" hint when form is valid
 * 3. **Form Validation**: 
 *    - Email regex validation
 *    - Required fields enforcement
 *    - Submit button disabled until form is valid
 * 4. **Accessibility**:
 *    - ARIA labels on all inputs
 *    - Autocomplete attributes for password managers
 *    - Keyboard support (Enter to submit)
 *    - Clear visual feedback for all states
 * 5. **Premium UI**: Glassmorphism design matching registration page
 * 
 * SECURITY:
 * - Passwords never stored in localStorage (only email for convenience)
 * - Uses HTTPS in production (Next.js default)
 * - NextAuth handles CSRF protection
 * - Rate limiting should be added at API level
 * - Caps Lock warning prevents accidental login failures
 * 
 * AAA QUALITY FEATURES:
 * - Auto-focus for seamless UX
 * - Success animation provides positive feedback
 * - Remember me feature for returning users
 * - Visual validation reduces user errors
 * - Caps Lock detection prevents common mistakes
 * - Password visibility toggle improves usability
 * - Enter key support for power users
 * - All inputs disabled during loading (prevents race conditions)
 */
