'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Catalogue, Collection } from '@/types';

export default function ReportsPage() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [catalogueId, setCatalogueId] = useState('');
  const [collectionId, setCollectionId] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/catalogues').then((response) => response.json()),
      fetch('/api/collections').then((response) => response.json()),
    ])
      .then(([catalogueData, collectionData]) => {
        setCatalogues(catalogueData);
        setCollections(collectionData);
      })
      .catch(console.error);
  }, []);

  const availableCollections = useMemo(() => (
    catalogueId
      ? collections.filter((collection) => collection.catalogueId === catalogueId)
      : collections
  ), [catalogueId, collections]);

  const reportParams = new URLSearchParams();
  if (catalogueId) reportParams.set('catalogueId', catalogueId);
  if (collectionId) reportParams.set('collectionId', collectionId);

  const query = reportParams.toString();

  return (
    <div className="space-y-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Reports & exports</h1>
        <p className="text-sm text-gray-500">Create insurance-ready summaries and export inventory data.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
        <select
          value={catalogueId}
          onChange={(event) => {
            setCatalogueId(event.target.value);
            setCollectionId('');
          }}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Entire inventory</option>
          {catalogues.map((catalogue) => (
            <option key={catalogue.id} value={catalogue.id}>
              {catalogue.icon} {catalogue.name}
            </option>
          ))}
        </select>

        <select
          value={collectionId}
          onChange={(event) => setCollectionId(event.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All collections</option>
          {availableCollections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.catalogue?.icon} {collection.name}
            </option>
          ))}
        </select>

        <a
          href={`/api/reports/csv${query ? `?${query}` : ''}`}
          className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Download CSV export
        </a>

        <Link
          href={`/reports/insurance${query ? `?${query}` : ''}`}
          className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Open insurance report
        </Link>
      </div>
    </div>
  );
}
