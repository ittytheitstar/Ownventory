'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Item } from '@/types';

type SummaryPayload = {
  generatedAt: string;
  totalEstimatedValue: number;
  items: Item[];
};

function InsuranceReportContent() {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<SummaryPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/reports/summary?${searchParams.toString()}`)
      .then((response) => response.json())
      .then(setReport)
      .catch(() => setError('Unable to load insurance report.'));
  }, [searchParams]);

  if (error) return <p className="py-16 text-center text-sm text-red-700">{error}</p>;
  if (!report) return <p className="py-16 text-center text-sm text-gray-400">Loading report…</p>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 print:shadow-none print:border-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Insurance summary</h1>
            <p className="text-sm text-gray-500">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white print:hidden"
          >
            Print / save as PDF
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-gray-500">Items</p>
            <p className="text-xl font-semibold text-gray-900">{report.items.length}</p>
          </div>
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-gray-500">Estimated total</p>
            <p className="text-xl font-semibold text-gray-900">${report.totalEstimatedValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {report.items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 print:shadow-none print:border-gray-200">
            <div className="flex gap-4">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-20 w-20 rounded-xl bg-gray-100 object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.catalogue?.name}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    ${Number(item.estimatedValue ?? 0).toFixed(2)}
                  </p>
                </div>
                {item.description && <p className="mt-2 text-sm text-gray-600">{item.description}</p>}
                <p className="mt-2 text-xs text-gray-400">
                  {item.barcode ? `Barcode ${item.barcode}` : `Item ID ${item.id}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InsuranceReportPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-gray-400">Loading report…</div>}>
      <InsuranceReportContent />
    </Suspense>
  );
}
