import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwner } from '@/lib/route-auth';
import { serializeStocktakeSession, stocktakeSessionArgs } from '@/lib/stocktake';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const value = body.value?.trim();

  if (!value) {
    return NextResponse.json({ error: 'A scan value is required' }, { status: 400 });
  }

  const session = await prisma.stocktakeSession.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          item: true,
        },
      },
    },
  });

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (session.endedAt) {
    return NextResponse.json({ error: 'This stock-take session has already ended' }, { status: 400 });
  }

  const normalized = value.toLowerCase();
  const existingExpected = session.items.find((entry) => entry.expected && entry.item && (
    entry.item.id.toLowerCase() === normalized
    || entry.item.barcode?.toLowerCase() === normalized
    || entry.item.name.trim().toLowerCase() === normalized
  ));

  if (existingExpected) {
    if (!existingExpected.scannedAt) {
      await prisma.stocktakeItem.update({
        where: { id: existingExpected.id },
        data: {
          scannedAt: new Date(),
          scanValue: value,
        },
      });
    }
  } else {
    const matchedItem = await prisma.item.findFirst({
      where: {
        OR: [
          { id: value },
          { barcode: value },
          { name: { equals: value, mode: 'insensitive' } },
        ],
      },
    });

    const existingUnexpected = matchedItem
      ? session.items.find((entry) => !entry.expected && entry.itemId === matchedItem.id)
      : undefined;

    if (existingUnexpected) {
      if (!existingUnexpected.scannedAt) {
        await prisma.stocktakeItem.update({
          where: { id: existingUnexpected.id },
          data: { scannedAt: new Date(), scanValue: value },
        });
      }
    } else {
      await prisma.stocktakeItem.create({
        data: {
          sessionId: id,
          itemId: matchedItem?.id,
          label: matchedItem?.name ?? value,
          scanValue: value,
          expected: false,
          scannedAt: new Date(),
        },
      });
    }
  }

  const updated = await prisma.stocktakeSession.findUnique({
    where: { id },
    ...stocktakeSessionArgs,
  });

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(serializeStocktakeSession(updated));
}
