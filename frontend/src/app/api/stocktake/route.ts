import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireOwner } from '@/lib/route-auth';
import { serializeStocktakeSession, stocktakeSessionArgs } from '@/lib/stocktake';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const sessions = await prisma.stocktakeSession.findMany({
    ...stocktakeSessionArgs,
    orderBy: { startedAt: 'desc' },
    take: 10,
  });

  return NextResponse.json(sessions.map(serializeStocktakeSession));
}

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (auth.response || !auth.user) return auth.response;

  const body = await request.json();
  const name = body.name?.trim();
  const catalogueId = body.catalogueId?.trim() || undefined;
  const collectionId = body.collectionId?.trim() || undefined;
  const notes = body.notes?.trim() || undefined;

  if (!name) {
    return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
  }

  if (!catalogueId && !collectionId) {
    return NextResponse.json({ error: 'Select a catalogue or collection' }, { status: 400 });
  }

  const expectedItems = collectionId
    ? await prisma.item.findMany({
        where: { collections: { some: { collectionId } } },
        select: { id: true, name: true, barcode: true },
        orderBy: { name: 'asc' },
      })
    : await prisma.item.findMany({
        where: { catalogueId },
        select: { id: true, name: true, barcode: true },
        orderBy: { name: 'asc' },
      });

  const session = await prisma.stocktakeSession.create({
    data: {
      name,
      catalogueId,
      collectionId,
      notes,
      createdById: auth.user.id,
      items: {
        create: expectedItems.map((item) => ({
          itemId: item.id,
          label: item.name,
          scanValue: item.barcode ?? undefined,
          expected: true,
        })),
      },
    },
    ...stocktakeSessionArgs,
  });

  return NextResponse.json(serializeStocktakeSession(session), { status: 201 });
}
