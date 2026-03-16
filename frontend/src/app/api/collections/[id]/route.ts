import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const collection = await prisma.collection.findUnique({
    where: { id: params.id },
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

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.collection.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
