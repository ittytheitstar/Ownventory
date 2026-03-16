'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Item } from '@/types';

export default function ItemLabelPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((response) => response.json())
      .then(setItem)
      .catch(console.error);
  }, [id]);

  if (!item) return <div className="py-16 text-center text-sm text-gray-400">Loading label…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR label</h1>
          <p className="text-sm text-gray-500">Print this sticker and attach it to the item.</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white print:hidden"
        >
          Print label
        </button>
      </div>

      <div className="mx-auto max-w-sm rounded-[2rem] border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm print:shadow-none">
        <div className="mx-auto h-56 w-56 rounded-2xl border border-gray-100 bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/items/${item.id}/qr`}
            alt={`QR code for ${item.name}`}
            className="h-full w-full"
          />
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-900">{item.name}</p>
        <p className="text-sm text-gray-500">{item.catalogue?.name}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-400">
          {item.barcode ?? item.id}
        </p>
      </div>
    </div>
  );
}
