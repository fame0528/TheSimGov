/**
 * @fileoverview Forgot Password Placeholder Page
 * @module app/(auth)/forgot-password
 *
 * OVERVIEW:
 * Simple placeholder UI for password reset flow.
 * Collects email and shows a friendly message.
 *
 * @created 2025-11-26
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, Input, Button, Divider, Link } from '@heroui/react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Unable to process request. Please try again later.');
        setLoading(false);
        return;
      }
      setSubmitted(true);
      setLoading(false);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
        <CardBody className="gap-6 p-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent">
              Forgot Password
            </h1>
            <p className="text-slate-400">Enter your email to receive reset instructions.</p>
          </div>

          <Divider className="bg-white/10" />

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onValueChange={setEmail}
                isRequired
                variant="bordered"
                aria-label="Email Address"
                autoComplete="email"
                classNames={{
                  input: 'text-white',
                  inputWrapper: 'border-white/20 bg-slate-900/50 hover:border-emerald-400/50 data-[focus=true]:border-emerald-400',
                }}
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300"
                size="lg"
                isDisabled={!email || loading}
                isLoading={loading}
              >
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-3 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 animate-pulse">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-emerald-400 font-semibold text-lg">If an account exists, we sent an email.</p>
              <p className="text-slate-400 text-sm">Check your inbox for next steps.</p>
            </div>
          )}

          <Divider className="bg-white/10" />

          <div className="text-center">
            <p className="text-slate-300 text-sm">
              Remember your password?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * - Placeholder only; backend reset route not implemented.
 * - Keeps styling consistent with register/login pages.
 */
