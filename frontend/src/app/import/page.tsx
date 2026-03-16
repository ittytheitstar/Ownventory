'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ImportResult {
  created: number;
  errors: string[];
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileError, setFileError] = useState('');

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setFileError('Please select a CSV file.');
      return;
    }

    setImporting(true);
    setResult(null);
    setFileError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setFileError(data.error ?? 'Import failed');
      } else {
        setResult(data);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch {
      setFileError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/" className="text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import</h1>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
        <h2 className="font-semibold text-gray-900">CSV Format</h2>
        <p className="text-sm text-gray-500">
          Upload a CSV file with the following columns (only <strong>name</strong> is required):
        </p>
        <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
          <code className="text-xs text-gray-700 whitespace-nowrap">
            name, description, barcode, isbn, catalogue, author, publisher, year, manufacturer, notes, status, imageUrl
          </code>
        </div>
        <p className="text-xs text-gray-400">
          Valid catalogues: Books, Video Games, Music, Movies &amp; TV, Electronics, Tools, Toys, Jewellery, Food &amp; Drink, General
          <br />
          Valid statuses: OWNED (default), LOST, STOLEN, DAMAGED, DESTROYED
        </p>
      </div>

      <form onSubmit={handleImport} className="space-y-4">
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Click to select a CSV file</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={() => setFileError('')}
          />
        </div>

        {fileError && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl p-3 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {fileError}
          </div>
        )}

        <button
          type="submit"
          disabled={importing}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {importing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Importing…
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Import
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">{result.created} item{result.created !== 1 ? 's' : ''} imported</span>
          </div>
          {result.errors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} skipped:
              </p>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-600">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link
            href="/library"
            className="block text-center text-sm text-indigo-600 font-medium"
          >
            View library →
          </Link>
        </div>
      )}
    </div>
  );
}
