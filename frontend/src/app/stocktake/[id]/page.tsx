'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import type { StocktakeSession, User } from '@/types';

type AuthState = {
  user: User | null;
  needsSetup: boolean;
};

export default function StocktakeSessionPage() {
  const { id } = useParams<{ id: string }>();
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [session, setSession] = useState<StocktakeSession | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [me, sessionData] = await Promise.all([
        fetch('/api/auth/me').then((response) => response.json()),
        fetch(`/api/stocktake/${id}`).then((response) => response.json()),
      ]);
      setAuthState(me);
      setSession(sessionData);
    } catch {
      setError('Unable to load stock-taking session.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load().catch(() => setError('Unable to load stock-taking session.'));
  }, [load]);

  const handleScan = async (value: string) => {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/stocktake/${id}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Unable to record scan');
      }

      setSession(await response.json());
      setQuery('');
      setShowScanner(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record scan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async () => {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`/api/stocktake/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ end: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Unable to complete session');
      }

      setSession(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete session');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmed = useMemo(() => session?.items.filter((item) => item.expected && item.scannedAt) ?? [], [session]);
  const missing = useMemo(() => session?.items.filter((item) => item.expected && !item.scannedAt) ?? [], [session]);
  const newItems = useMemo(() => session?.items.filter((item) => !item.expected && item.scannedAt) ?? [], [session]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-gray-400">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!session) return <div className="py-16 text-center text-sm text-gray-400">Session not found.</div>;

  const canEdit = authState?.user?.role === 'OWNER' && !session.endedAt;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
            <p className="text-sm text-gray-500">
              {session.collection?.name ?? session.catalogue?.name ?? 'Inventory'} • started by {session.createdBy.name}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            session.endedAt ? 'bg-gray-100 text-gray-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {session.endedAt ? 'Completed' : 'Active'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl bg-emerald-50 px-3 py-3 text-emerald-700">Confirmed {session.summary.confirmed}</div>
          <div className="rounded-xl bg-amber-50 px-3 py-3 text-amber-700">Missing {session.summary.missing}</div>
          <div className="rounded-xl bg-sky-50 px-3 py-3 text-sky-700">New {session.summary.new}</div>
        </div>

        {canEdit && (
          <>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (query.trim()) handleScan(query.trim()).catch(() => setError('Unable to record scan'));
              }}
            >
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Scan a barcode or enter an item name"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-600"
                aria-label="Open barcode scanner"
              >
                <Camera className="h-5 w-5" />
              </button>
              <button
                type="submit"
                disabled={submitting || !query.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                Check in
              </button>
            </form>

            <button
              type="button"
              onClick={handleEnd}
              disabled={submitting}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              End session and flag missing items
            </button>
          </>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={(value) => {
            handleScan(value).catch(() => setError('Unable to record scan'));
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <StocktakeList title="Confirmed items" items={confirmed} emptyMessage="Nothing has been checked in yet." />
      <StocktakeList title="Potentially missing" items={missing} emptyMessage="No missing items." />
      <StocktakeList title="New items found" items={newItems} emptyMessage="No unexpected items found." />
    </div>
  );
}

function StocktakeList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: StocktakeSession['items'];
  emptyMessage: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-gray-100 px-4 py-3">
              <p className="font-medium text-gray-900">{entry.item?.name ?? entry.label}</p>
              <p className="text-sm text-gray-500">
                {entry.item?.barcode ?? entry.scanValue ?? 'No barcode recorded'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      )}
    </div>
  );
}
