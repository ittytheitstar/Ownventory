import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { estimatePrice } from '@/lib/price-lookup';

export const dynamic = 'force-dynamic';

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id },
    include: { catalogue: true },
  });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await estimatePrice(item.name, item.catalogue?.name);
  if (!result) {
    return NextResponse.json(
      { error: 'Price estimation unavailable' },
      { status: 422 }
    );
  }

  const updated = await prisma.item.update({
    where: { id },
    data: {
      estimatedValue: result.estimatedValue,
      valueFetchedAt: new Date(result.fetchedAt),
    },
    include: { catalogue: true },
  });

  return NextResponse.json(updated);
}
