import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const catalogues = await prisma.catalogue.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { items: true, collections: true } },
    },
  });
  return NextResponse.json(catalogues);
}
