import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ItemStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const catalogueId = searchParams.get('catalogueId');
  const collectionId = searchParams.get('collectionId');
  const status = searchParams.get('status') as ItemStatus | null;
  const q = searchParams.get('q');

  const items = await prisma.item.findMany({
    where: {
      ...(catalogueId ? { catalogueId } : {}),
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { barcode: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(collectionId
        ? { collections: { some: { collectionId } } }
        : {}),
    },
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
