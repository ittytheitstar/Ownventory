'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { ItemCard } from '@/components/ItemCard';
import type { Catalogue, Item } from '@/types';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'OWNED', label: 'Owned' },
  { value: 'LOST', label: 'Lost' },
  { value: 'STOLEN', label: 'Stolen' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'DESTROYED', label: 'Destroyed' },
];

function LibraryContent() {
  const searchParams = useSearchParams();
  const initialCatalogueId = searchParams.get('catalogueId') ?? '';

  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [catalogueId, setCatalogueId] = useState(initialCatalogueId);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/catalogues').then((r) => r.json()).then(setCatalogues).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (catalogueId) params.set('catalogueId', catalogueId);
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    fetch(`/api/items?${params}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [catalogueId, status, q]);

  const activeCatalogue = catalogues.find((c) => c.id === catalogueId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Library</h1>
        {activeCatalogue && (
          <span className="text-2xl">{activeCatalogue.icon}</span>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search items…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <select
          value={catalogueId}
          onChange={(e) => setCatalogueId(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white flex-shrink-0"
        >
          <option value="">All catalogues</option>
          {catalogues.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white flex-shrink-0"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {!catalogueId && !q && (
        <div className="grid grid-cols-2 gap-3">
          {catalogues.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCatalogueId(cat.id)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
            >
              <span className="text-3xl">{cat.icon}</span>
              <p className="font-semibold text-gray-900 mt-2">{cat.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cat._count?.items ?? 0} items</p>
            </button>
          ))}
        </div>
      )}

      {(catalogueId || q) && (
        <>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading…' : `${items.length} item${items.length !== 1 ? 's' : ''}`}
          </p>
          <div className="space-y-2">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
            {!loading && items.length === 0 && (
              <p className="text-center text-gray-400 py-10">No items found</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10 text-gray-400">Loading…</div>}>
      <LibraryContent />
    </Suspense>
  );
}
