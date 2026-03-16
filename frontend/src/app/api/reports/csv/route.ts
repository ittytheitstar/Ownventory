import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildItemWhere } from '@/lib/item-filters';
import { requireAuth } from '@/lib/route-auth';

export const dynamic = 'force-dynamic';

function escapeCsv(value: string | number | null | undefined) {
  const stringValue = value == null ? '' : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function getScope(catalogueId?: string | null, collectionId?: string | null) {
  if (collectionId) return { scopeType: 'collection', scopeId: collectionId };
  if (catalogueId) return { scopeType: 'catalogue', scopeId: catalogueId };
  return { scopeType: 'inventory', scopeId: null };
}

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const catalogueId = searchParams.get('catalogueId');
  const collectionId = searchParams.get('collectionId');

  const items = await prisma.item.findMany({
    where: buildItemWhere({ catalogueId, collectionId }),
    orderBy: { createdAt: 'desc' },
    include: {
      catalogue: { select: { name: true } },
      collections: {
        include: { collection: { select: { name: true } } },
      },
    },
  });

  const rows = [
    [
      'Name',
      'Catalogue',
      'Collections',
      'Status',
      'Estimated Value',
      'Barcode',
      'Description',
      'Added',
    ],
    ...items.map((item) => ([
      item.name,
      item.catalogue?.name ?? '',
      item.collections.map(({ collection }) => collection.name).join('; '),
      item.status,
      item.estimatedValue?.toString() ?? '',
      item.barcode ?? '',
      item.description ?? '',
      item.createdAt.toISOString(),
    ])),
  ];

  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  const scope = getScope(catalogueId, collectionId);

  await prisma.report.create({
    data: {
      name: `Inventory export ${new Date().toISOString()}`,
      format: 'csv',
      scopeType: scope.scopeType,
      scopeId: scope.scopeId,
      metadata: {
        itemCount: items.length,
      },
    },
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ownventory-export.csv"',
    },
  });
}
