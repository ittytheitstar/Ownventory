'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Trash2, Loader2, Edit2, Check, X } from 'lucide-react';
import type { Item, ItemStatus } from '@/types';
import { STATUS_LABELS } from '@/types';

const STATUS_OPTIONS: ItemStatus[] = ['OWNED', 'LOST', 'STOLEN', 'DAMAGED', 'DESTROYED'];

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((r) => r.json())
      .then((data: Item) => {
        setItem(data);
        setNotes(data.notes ?? '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: ItemStatus) => {
    if (!item) return;
    setSaving(true);
    const updated = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then((r) => r.json());
    setItem(updated);
    setSaving(false);
  };

  const saveNotes = async () => {
    if (!item) return;
    setSaving(true);
    const updated = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }).then((r) => r.json());
    setItem(updated);
    setEditingNotes(false);
    setSaving(false);
  };

  const deleteItem = async () => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/items/${item!.id}`, { method: 'DELETE' });
    router.push('/library');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }
  if (!item) return <p className="text-center py-10 text-gray-400">Item not found</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-gray-900 truncate">{item.name}</h1>
        <button onClick={deleteItem} className="text-red-400 hover:text-red-600">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {item.imageUrl && (
        <div className="relative w-full h-56 bg-gray-100 rounded-xl overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-contain"
            sizes="(max-width: 512px) 100vw"
            unoptimized
          />
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-3">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={saving}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                item.status === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
        <h2 className="font-semibold text-gray-900">Details</h2>
        <Detail label="Catalogue" value={`${item.catalogue?.icon ?? ''} ${item.catalogue?.name}`} />
        {item.author && <Detail label="Author" value={item.author} />}
        {item.manufacturer && <Detail label="Manufacturer" value={item.manufacturer} />}
        {item.publisher && <Detail label="Publisher" value={item.publisher} />}
        {item.year && <Detail label="Year" value={String(item.year)} />}
        {item.barcode && <Detail label="Barcode" value={item.barcode} />}
        {item.isbn && <Detail label="ISBN" value={item.isbn} />}
        {item.description && <Detail label="Description" value={item.description} />}
        {item.collections && item.collections.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Collections</p>
            <div className="flex flex-wrap gap-1">
              {item.collections.map(({ collection, collectionId }) => (
                <a
                  key={collectionId}
                  href={`/collections/${collectionId}`}
                  className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full"
                >
                  {collection.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900">Notes</h2>
          {!editingNotes ? (
            <button onClick={() => setEditingNotes(true)} className="text-gray-400 hover:text-gray-600">
              <Edit2 className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex gap-1">
              <button onClick={saveNotes} disabled={saving} className="text-green-500">
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setNotes(item.notes ?? ''); setEditingNotes(false); }}
                className="text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {editingNotes ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add notes…"
          />
        ) : (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {item.notes || <span className="text-gray-400">No notes yet</span>}
          </p>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
