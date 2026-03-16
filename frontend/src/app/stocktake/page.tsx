'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Catalogue, Collection, StocktakeSession, User } from '@/types';

type AuthState = {
  user: User | null;
  needsSetup: boolean;
};

export default function StocktakePage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sessions, setSessions] = useState<StocktakeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scopeType, setScopeType] = useState<'catalogue' | 'collection'>('catalogue');
  const [form, setForm] = useState({
    name: '',
    catalogueId: '',
    collectionId: '',
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((response) => response.json()),
      fetch('/api/catalogues').then((response) => response.json()),
      fetch('/api/collections').then((response) => response.json()),
      fetch('/api/stocktake').then((response) => response.json()),
    ])
      .then(([me, catalogueData, collectionData, sessionData]: [AuthState, Catalogue[], Collection[], StocktakeSession[]]) => {
        setAuthState(me);
        setCatalogues(catalogueData);
        setCollections(collectionData);
        setSessions(sessionData);
      })
      .catch(() => setError('Unable to load stock-taking data.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredCollections = useMemo(() => (
    form.catalogueId
      ? collections.filter((collection) => collection.catalogueId === form.catalogueId)
      : collections
  ), [collections, form.catalogueId]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/stocktake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          notes: form.notes,
          catalogueId: scopeType === 'catalogue' ? form.catalogueId : undefined,
          collectionId: scopeType === 'collection' ? form.collectionId : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Unable to start session');
      }

      const session: StocktakeSession = await response.json();
      router.push(`/stocktake/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start session');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-sm text-gray-400">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock-taking</h1>
          <p className="text-sm text-gray-500">Check off what was found and flag anything missing.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
          {(['catalogue', 'collection'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setScopeType(option)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                scopeType === option ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'
              }`}
            >
              {option === 'catalogue' ? 'Catalogue session' : 'Collection session'}
            </button>
          ))}
        </div>

        {authState?.user?.role === 'OWNER' ? (
          <form className="space-y-3" onSubmit={handleCreate}>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Session name"
              required
            />

            <select
              value={form.catalogueId}
              onChange={(event) => setForm((current) => ({
                ...current,
                catalogueId: event.target.value,
                collectionId: '',
              }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select catalogue</option>
              {catalogues.map((catalogue) => (
                <option key={catalogue.id} value={catalogue.id}>
                  {catalogue.icon} {catalogue.name}
                </option>
              ))}
            </select>

            {scopeType === 'collection' && (
              <select
                value={form.collectionId}
                onChange={(event) => setForm((current) => ({ ...current, collectionId: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select collection</option>
                {filteredCollections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.catalogue?.icon} {collection.name}
                  </option>
                ))}
              </select>
            )}

            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional notes"
            />

            {error && <p className="text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Starting…' : 'Start stock-take'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500">
            Viewers can review stock-taking sessions, but only owners can start or update them.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Recent sessions</h2>
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => router.push(`/stocktake/${session.id}`)}
            className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{session.name}</p>
                <p className="text-sm text-gray-500">
                  {session.collection?.name ?? session.catalogue?.name ?? 'Inventory'}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                session.endedAt ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {session.endedAt ? 'Completed' : 'Active'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500">
              <div className="rounded-xl bg-gray-50 px-3 py-2">Confirmed: {session.summary.confirmed}</div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">Missing: {session.summary.missing}</div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">New: {session.summary.new}</div>
            </div>
          </button>
        ))}
        {sessions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
            No stock-taking sessions yet.
          </div>
        )}
      </div>
    </div>
  );
}
