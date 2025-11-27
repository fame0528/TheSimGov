/**
 * @fileoverview Reset Password Page (Token-based)
 * @module app/(auth)/reset-password/[token]
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardBody, Input, Button, Divider, Link } from '@heroui/react';

export default function ResetPasswordTokenPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch('/api/auth/password/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/login?success=Password updated'), 1000);
    } catch {
      setError('Server error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10">
        <CardBody className="gap-6 p-8">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-emerald-200 bg-clip-text text-transparent">
              Reset Password
            </h1>
            <p className="text-slate-400">Enter a new password for your account.</p>
          </div>

          <Divider className="bg-white/10" />

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="New Password"
                value={password}
                onValueChange={setPassword}
                isRequired
                variant="bordered"
                aria-label="New Password"
                autoComplete="new-password"
                classNames={{
                  input: 'text-white',
                  inputWrapper: 'border-white/20 bg-slate-900/50 hover:border-emerald-400/50 data-[focus=true]:border-emerald-400',
                }}
              />
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onValueChange={setConfirm}
                isRequired
                variant="bordered"
                aria-label="Confirm Password"
                autoComplete="new-password"
                classNames={{
                  input: 'text-white',
                  inputWrapper: 'border-white/20 bg-slate-900/50 hover:border-emerald-400/50 data-[focus=true]:border-emerald-400',
                }}
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300"
                size="lg"
                isDisabled={!password || !confirm}
              >
                Update Password
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-3 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 animate-pulse">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-emerald-400 font-semibold text-lg">Password updated successfully!</p>
              <p className="text-slate-400 text-sm">Redirecting you to sign in…</p>
            </div>
          )}

          <Divider className="bg-white/10" />

          <div className="text-center">
            <p className="text-slate-300 text-sm">
              Need help?{' '}
              <Link href="/forgot-password" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                Request a new link
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
