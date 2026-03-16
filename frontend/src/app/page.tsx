'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, FolderOpen, Loader2, Camera } from 'lucide-react';
import type { Catalogue, Collection } from '@/types';
import { BarcodeScanner } from '@/components/BarcodeScanner';

interface LookupResultLocal {
  name: string;
  description?: string;
  author?: string;
  publisher?: string;
  year?: number;
  imageUrl?: string;
  catalogueName: string;
  manufacturer?: string;
  metadata?: Record<string, unknown>;
}

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResultLocal | null>(null);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionCatalogueId, setNewCollectionCatalogueId] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);

  useEffect(() => {
    fetch('/api/catalogues').then((r) => r.json()).then(setCatalogues).catch(console.error);
    fetch('/api/collections').then((r) => r.json()).then(setCollections).catch(console.error);
  }, []);

  const handleBarcodeScan = (value: string) => {
    setShowScanner(false);
    setQuery(value);
    // Auto-trigger lookup
    setLoading(true);
    setError('');
    setResult(null);
    fetch(`/api/lookup?q=${encodeURIComponent(value.trim())}`)
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setError('Lookup failed. Please try again.'))
      .finally(() => setLoading(false));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Lookup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const catalogue = catalogues.find(
        (c) => c.name.toLowerCase() === result.catalogueName.toLowerCase()
      ) ?? catalogues.find((c) => c.name === 'General');

      if (!catalogue) {
        setError('No catalogue found. Please try again.');
        return;
      }

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.name || query,
          description: result.description,
          barcode: /^\d{8,14}$/.test(query.trim()) ? query.trim() : undefined,
          isbn: result.metadata?.isbn,
          catalogueId: catalogue.id,
          collectionIds: selectedCollectionId ? [selectedCollectionId] : [],
          imageUrl: result.imageUrl,
          author: result.author,
          publisher: result.publisher,
          manufacturer: result.manufacturer,
          year: result.year,
          metadata: result.metadata,
        }),
      });
      const item = await res.json();
      router.push(`/items/${item.id}`);
    } catch {
      setError('Failed to add item.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !newCollectionCatalogueId) return;
    setCreatingCollection(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCollectionName.trim(),
          catalogueId: newCollectionCatalogueId,
        }),
      });
      const col = await res.json();
      setCollections((prev) => [...prev, col]);
      setSelectedCollectionId(col.id);
      setNewCollectionName('');
      setShowCollectionPicker(false);
    } catch {
      setError('Failed to create collection.');
    } finally {
      setCreatingCollection(false);
    }
  };

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  return (
    <div className="space-y-6">
      <div className="text-center pt-4">
        <h1 className="text-3xl font-bold text-indigo-600">Ownventory</h1>
        <p className="text-gray-500 text-sm mt-1">Track everything you own</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <FolderOpen className="h-4 w-4" /> Adding to collection
          </span>
          <button
            onClick={() => setShowCollectionPicker(!showCollectionPicker)}
            className="text-xs text-indigo-600 font-medium"
          >
            {selectedCollection ? 'Change' : 'Select collection'}
          </button>
        </div>

        {selectedCollection ? (
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full font-medium">
              {selectedCollection.catalogue?.icon} {selectedCollection.name}
            </span>
            <button
              onClick={() => setSelectedCollectionId('')}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No collection selected – items go to catalogue only</p>
        )}

        {showCollectionPicker && (
          <div className="mt-3 space-y-2">
            {collections.length > 0 && (
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={selectedCollectionId}
                onChange={(e) => {
                  setSelectedCollectionId(e.target.value);
                  setShowCollectionPicker(false);
                }}
              >
                <option value="">— pick existing —</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.catalogue?.icon} {c.catalogue?.name} › {c.name}
                  </option>
                ))}
              </select>
            )}

            <div className="border-t pt-2">
              <p className="text-xs text-gray-500 mb-2 font-medium">Create new collection</p>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
                value={newCollectionCatalogueId}
                onChange={(e) => setNewCollectionCatalogueId(e.target.value)}
              >
                <option value="">— select catalogue —</option>
                {catalogues.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Collection name…"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={handleCreateCollection}
                  disabled={creatingCollection || !newCollectionName || !newCollectionCatalogueId}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {creatingCollection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter name or scan barcode…"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="bg-white border border-gray-200 text-gray-600 px-4 py-3 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
            aria-label="Open camera scanner"
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Look up'}
          </button>
        </div>
      </form>

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex gap-4 p-4">
            {result.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.imageUrl}
                alt={result.name}
                className="w-20 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-indigo-600 font-medium mb-1">{result.catalogueName}</p>
              <h2 className="font-semibold text-gray-900 text-lg leading-tight">
                {result.name || <em className="text-gray-400">Unknown – please enter a name</em>}
              </h2>
              {result.author && <p className="text-sm text-gray-500 mt-1">by {result.author}</p>}
              {result.manufacturer && (
                <p className="text-sm text-gray-500 mt-1">{result.manufacturer}</p>
              )}
              {result.year && <p className="text-xs text-gray-400 mt-1">{result.year}</p>}
              {result.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-3">{result.description}</p>
              )}
            </div>
          </div>

          {!result.name && (
            <div className="px-4 pb-2">
              <input
                type="text"
                placeholder="Enter item name…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                onChange={(e) => setResult({ ...result, name: e.target.value })}
              />
            </div>
          )}

          <div className="border-t border-gray-100 p-4 flex gap-2">
            <button
              onClick={handleAddItem}
              disabled={loading || !result.name}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding…' : '+ Add to inventory'}
            </button>
            <button
              onClick={() => { setResult(null); setQuery(''); }}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {catalogues.slice(0, 4).map((cat) => (
          <a
            key={cat.id}
            href={`/library?catalogueId=${cat.id}`}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">{cat.icon}</span>
            <p className="font-medium text-gray-900 mt-1 text-sm">{cat.name}</p>
            <p className="text-xs text-gray-400">{cat._count?.items ?? 0} items</p>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/stocktake" className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
          <p className="text-lg">✅</p>
          <p className="mt-1 text-sm font-medium text-gray-900">Stocktake</p>
        </Link>
        <Link href="/reports" className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
          <p className="text-lg">📄</p>
          <p className="mt-1 text-sm font-medium text-gray-900">Reports</p>
        </Link>
        <Link href="/account" className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
          <p className="text-lg">👤</p>
          <p className="mt-1 text-sm font-medium text-gray-900">Account</p>
        </Link>
      </div>
    </div>
  );
}
