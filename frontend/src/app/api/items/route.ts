import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildItemWhere } from '@/lib/item-filters';
import { requireAuth, requireOwner } from '@/lib/route-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const catalogueId = searchParams.get('catalogueId');
  const collectionId = searchParams.get('collectionId');
  const status = searchParams.get('status');
  const q = searchParams.get('q');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const valueMin = searchParams.get('valueMin');
  const valueMax = searchParams.get('valueMax');

  const items = await prisma.item.findMany({
    where: buildItemWhere({
      catalogueId,
      collectionId,
      status,
      q,
      dateFrom,
      dateTo,
      valueMin,
      valueMax,
    }),
    orderBy: { createdAt: 'desc' },
    include: {
      catalogue: { select: { id: true, name: true, icon: true } },
      collections: {
        include: { collection: { select: { id: true, name: true } } },
      },
    },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const body = await request.json();
  const {
    name,
    description,
    barcode,
    isbn,
    catalogueId,
    collectionIds,
    imageUrl,
    manufacturer,
    author,
    publisher,
    year,
    metadata,
    notes,
  } = body;

  if (!name || !catalogueId) {
    return NextResponse.json({ error: 'name and catalogueId are required' }, { status: 400 });
  }

  const item = await prisma.item.create({
    data: {
      name,
      description,
      barcode,
      isbn,
      catalogueId,
      imageUrl,
      manufacturer,
      author,
      publisher,
      year,
      metadata,
      notes,
      ...(collectionIds?.length
        ? {
            collections: {
              create: (collectionIds as string[]).map((id) => ({ collectionId: id })),
            },
          }
        : {}),
    },
    include: {
      catalogue: true,
      collections: { include: { collection: true } },
    },
  });
  return NextResponse.json(item, { status: 201 });
}
