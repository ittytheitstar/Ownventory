'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';

type AuthState = {
  user: User | null;
  needsSetup: boolean;
};

export default function LoginPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((data: AuthState) => {
        setAuthState(data);
        if (data.user) router.replace('/');
      })
      .catch(() => setError('Unable to load authentication status.'))
      .finally(() => setLoading(false));
  }, [router]);

  const updateField = (field: 'name' | 'email' | 'password', value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const endpoint = authState?.needsSetup ? '/api/auth/register' : '/api/auth/login';
      const payload = authState?.needsSetup
        ? form
        : { email: form.email, password: form.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Authentication failed');
      }

      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div className="min-h-[70vh] flex items-center">
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-indigo-600">Ownventory</h1>
          <p className="text-sm text-gray-500">
            {authState?.needsSetup
              ? 'Create the first owner account to unlock Phase 3 features.'
              : 'Sign in to manage your shared household inventory.'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {authState?.needsSetup && (
            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">Your name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Home owner"
                required
              />
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-gray-700">
              Password
              {authState?.needsSetup && <span className="text-gray-400 font-normal"> (minimum 8 characters)</span>}
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting
              ? 'Please wait…'
              : authState?.needsSetup
                ? 'Create owner account'
                : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
