import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

/** Expected CSV columns (case-insensitive):
 *  name, description, barcode, isbn, catalogue, author, publisher, year,
 *  manufacturer, notes, status, imageUrl
 */
interface CsvRow {
  name?: string;
  description?: string;
  barcode?: string;
  isbn?: string;
  catalogue?: string;
  author?: string;
  publisher?: string;
  year?: string;
  manufacturer?: string;
  notes?: string;
  status?: string;
  imageurl?: string;
  imageUrl?: string;
}

const VALID_STATUSES = new Set(['OWNED', 'LOST', 'STOLEN', 'DAMAGED', 'DESTROYED']);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json({ error: 'Only CSV files are accepted' }, { status: 415 });
    }

    const text = await file.text();
    const parsed = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    if (parsed.errors.length && !parsed.data.length) {
      return NextResponse.json({ error: 'Failed to parse CSV' }, { status: 422 });
    }

    // Pre-fetch all catalogues for lookup
    const catalogues = await prisma.catalogue.findMany();
    const catalogueMap = new Map(
      catalogues.map((c) => [c.name.toLowerCase(), c])
    );
    const defaultCatalogue =
      catalogues.find((c) => c.name === 'General') ?? catalogues[0];

    const created: string[] = [];
    const errors: string[] = [];

    for (const [i, row] of parsed.data.entries()) {
      const name = row.name?.trim();
      if (!name) {
        errors.push(`Row ${i + 2}: missing name`);
        continue;
      }

      const catalogueName = row.catalogue?.trim().toLowerCase();
      const catalogue =
        (catalogueName ? catalogueMap.get(catalogueName) : undefined) ??
        defaultCatalogue;

      if (!catalogue) {
        errors.push(`Row ${i + 2}: no matching catalogue`);
        continue;
      }

      const rawStatus = row.status?.trim().toUpperCase();
      const status = VALID_STATUSES.has(rawStatus ?? '') ? rawStatus : 'OWNED';
      const year = row.year ? parseInt(row.year.trim()) : undefined;

      try {
        const item = await prisma.item.create({
          data: {
            name,
            description: row.description?.trim() || undefined,
            barcode: row.barcode?.trim() || undefined,
            isbn: row.isbn?.trim() || undefined,
            author: row.author?.trim() || undefined,
            publisher: row.publisher?.trim() || undefined,
            manufacturer: row.manufacturer?.trim() || undefined,
            notes: row.notes?.trim() || undefined,
            imageUrl: (row.imageUrl ?? row.imageurl)?.trim() || undefined,
            year: year && !isNaN(year) ? year : undefined,
            status: (status ?? 'OWNED') as 'OWNED' | 'LOST' | 'STOLEN' | 'DAMAGED' | 'DESTROYED',
            catalogueId: catalogue.id,
          },
        });
        created.push(item.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create item';
        errors.push(`Row ${i + 2}: ${msg}`);
      }
    }

    return NextResponse.json(
      { created: created.length, errors },
      { status: 201 }
    );
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
