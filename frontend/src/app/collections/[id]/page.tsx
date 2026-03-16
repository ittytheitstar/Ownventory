'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { ItemCard } from '@/components/ItemCard';
import type { Item } from '@/types';

interface CollectionDetail {
  id: string;
  name: string;
  description?: string;
  catalogue: { name: string; icon?: string };
  items: { item: Item }[];
}

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/collections/${id}`)
      .then((r) => r.json())
      .then(setCollection)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this collection? Items will not be deleted.')) return;
    await fetch(`/api/collections/${id}`, { method: 'DELETE' });
    router.push('/collections');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }
  if (!collection) return <p className="text-center py-10 text-gray-400">Collection not found</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span>{collection.catalogue.icon}</span>
            <span className="text-xs text-gray-500">{collection.catalogue.name}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{collection.name}</h1>
        </div>
        <button onClick={handleDelete} className="text-red-400 hover:text-red-600">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {collection.description && (
        <p className="text-sm text-gray-500">{collection.description}</p>
      )}

      <p className="text-sm text-gray-400">{collection.items.length} items</p>

      <div className="space-y-2">
        {collection.items.map(({ item }) => (
          <ItemCard key={item.id} item={item} />
        ))}
        {collection.items.length === 0 && (
          <p className="text-center text-gray-400 py-10">No items in this collection yet</p>
        )}
      </div>
    </div>
  );
}
