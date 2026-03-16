import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/route-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const catalogues = await prisma.catalogue.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { items: true, collections: true } },
    },
  });
  return NextResponse.json(catalogues);
}
