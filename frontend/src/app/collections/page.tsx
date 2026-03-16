'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, FolderOpen } from 'lucide-react';
import type { Catalogue, Collection } from '@/types';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [catalogueId, setCatalogueId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/collections').then((r) => r.json()),
      fetch('/api/catalogues').then((r) => r.json()),
    ])
      .then(([cols, cats]) => {
        setCollections(cols);
        setCatalogues(cats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !catalogueId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description, catalogueId }),
      });
      const col = await res.json();
      setCollections((prev) => [...prev, col]);
      setName('');
      setDescription('');
      setCatalogueId('');
      setShowForm(false);
    } catch {
      alert('Failed to create collection');
    } finally {
      setSaving(false);
    }
  };

  const grouped = collections.reduce<Record<string, Collection[]>>((acc, col) => {
    const key = col.catalogue?.name ?? 'Unknown';
    acc[key] = [...(acc[key] ?? []), col];
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-semibold text-gray-900">New Collection</h2>
          <select
            required
            value={catalogueId}
            onChange={(e) => setCatalogueId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select catalogue…</option>
            {catalogues.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <input
            required
            type="text"
            placeholder="Collection name (e.g. Carl's Books)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      )}

      {Object.entries(grouped).map(([catalogueName, cols]) => {
        const cat = catalogues.find((c) => c.name === catalogueName);
        return (
          <div key={catalogueName}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {cat?.icon} {catalogueName}
            </h2>
            <div className="space-y-2">
              {cols.map((col) => (
                <Link key={col.id} href={`/collections/${col.id}`}>
                  <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <FolderOpen className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{col.name}</p>
                      {col.description && (
                        <p className="text-sm text-gray-500 truncate">{col.description}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{col._count?.items ?? 0} items</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {!loading && collections.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No collections yet</p>
          <p className="text-sm mt-1">Create a collection to group your items</p>
        </div>
      )}
    </div>
  );
}
