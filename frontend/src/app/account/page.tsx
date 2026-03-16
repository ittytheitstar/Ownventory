'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';

type AuthState = {
  user: User | null;
  needsSetup: boolean;
};

export default function AccountPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VIEWER',
  });

  const load = async () => {
    setLoading(true);
    try {
      const meResponse = await fetch('/api/auth/me');
      const meData: AuthState = await meResponse.json();
      setAuthState(meData);

      if (!meData.user) {
        router.replace('/login');
        return;
      }

      if (meData.user.role === 'OWNER') {
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          setUsers(await usersResponse.json());
        }
      }
    } catch {
      setError('Unable to load account details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => setError('Unable to load account details.'));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Unable to create user');
      }

      setForm({ name: '', email: '', password: '', role: 'VIEWER' });
      setMessage('Household member added.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-400">Loading…</div>;
  }

  const user = authState?.user;
  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Signed in as</p>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            user.role === 'OWNER'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {user.role === 'OWNER' ? 'Owner' : 'Viewer'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>

      {user.role === 'OWNER' ? (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add household member</h2>
              <p className="text-sm text-gray-500">Owners can create viewer or owner accounts for shared access.</p>
            </div>

            <form className="space-y-3" onSubmit={handleCreateUser}>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Name"
                required
              />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Email"
                required
              />
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Password"
                required
                minLength={8}
              />
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as 'OWNER' | 'VIEWER' }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="VIEWER">Viewer</option>
                <option value="OWNER">Owner</option>
              </select>

              {message && <p className="text-sm text-green-700">{message}</p>}
              {error && <p className="text-sm text-red-700">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Add user'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Household members</h2>
            <div className="space-y-2">
              {users.map((householdUser) => (
                <div
                  key={householdUser.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{householdUser.name}</p>
                    <p className="text-sm text-gray-500">{householdUser.email}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">{householdUser.role}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900">Viewer access</h2>
          <p className="mt-2 text-sm text-gray-500">
            Viewers can browse the library, reports, and stock-taking results but only owners can add or modify inventory data.
          </p>
        </div>
      )}
    </div>
  );
}
