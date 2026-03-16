import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireOwner } from '@/lib/route-auth';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      catalogue: true,
      items: {
        include: { item: { include: { catalogue: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(collection);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await params;
  await prisma.collection.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
