'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { ItemCard } from '@/components/ItemCard';
import type { Catalogue, Collection, Item } from '@/types';

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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [catalogueId, setCatalogueId] = useState(initialCatalogueId);
  const [collectionId, setCollectionId] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/catalogues').then((r) => r.json()),
      fetch('/api/collections').then((r) => r.json()),
    ])
      .then(([catalogueData, collectionData]) => {
        setCatalogues(catalogueData);
        setCollections(collectionData);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (catalogueId) params.set('catalogueId', catalogueId);
    if (collectionId) params.set('collectionId', collectionId);
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (valueMin) params.set('valueMin', valueMin);
    if (valueMax) params.set('valueMax', valueMax);

    fetch(`/api/items?${params}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [catalogueId, collectionId, status, q, dateFrom, dateTo, valueMin, valueMax]);

  const activeCatalogue = catalogues.find((c) => c.id === catalogueId);
  const filteredCollections = catalogueId
    ? collections.filter((collection) => collection.catalogueId === catalogueId)
    : collections;

  const reportParams = new URLSearchParams();
  if (catalogueId) reportParams.set('catalogueId', catalogueId);
  if (collectionId) reportParams.set('collectionId', collectionId);

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
          placeholder="Search names, descriptions, barcodes, notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={catalogueId}
          onChange={(e) => {
            setCatalogueId(e.target.value);
            setCollectionId('');
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white flex-1 min-w-[150px]"
        >
          <option value="">All catalogues</option>
          {catalogues.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        <select
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white flex-1 min-w-[150px]"
        >
          <option value="">All collections</option>
          {filteredCollections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white flex-1 min-w-[150px]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((current) => !current)}
        className="text-sm font-medium text-indigo-600"
      >
        {showAdvanced ? 'Hide advanced filters' : 'Show advanced filters'}
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Added from</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Added to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Min value</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valueMin}
              onChange={(e) => setValueMin(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Max value</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valueMax}
              onChange={(e) => setValueMax(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="999.99"
            />
          </label>
        </div>
      )}

      <div className="flex gap-2">
        <a
          href={`/api/reports/csv${reportParams.toString() ? `?${reportParams.toString()}` : ''}`}
          className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Export CSV
        </a>
        <Link
          href={`/reports/insurance${reportParams.toString() ? `?${reportParams.toString()}` : ''}`}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Insurance report
        </Link>
      </div>

      {!catalogueId && !q && !collectionId && (
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
