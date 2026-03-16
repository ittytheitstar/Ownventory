import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildItemWhere } from '@/lib/item-filters';
import { requireAuth } from '@/lib/route-auth';

export const dynamic = 'force-dynamic';

function getScopeLabel(catalogueId?: string | null, collectionId?: string | null) {
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

  const where = buildItemWhere({ catalogueId, collectionId });
  const items = await prisma.item.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      catalogue: { select: { id: true, name: true, icon: true } },
      collections: {
        include: { collection: { select: { id: true, name: true } } },
      },
    },
  });

  const totalEstimatedValue = items.reduce((sum, item) => sum + Number(item.estimatedValue ?? 0), 0);
  const scope = getScopeLabel(catalogueId, collectionId);

  await prisma.report.create({
    data: {
      name: `Insurance report ${new Date().toISOString()}`,
      format: 'print',
      scopeType: scope.scopeType,
      scopeId: scope.scopeId,
      metadata: {
        itemCount: items.length,
        totalEstimatedValue,
      },
    },
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    totalEstimatedValue,
    items,
  });
}
