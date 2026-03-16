import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ItemStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      catalogue: true,
      collections: { include: { collection: { include: { catalogue: true } } } },
    },
  });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const allowed = [
    'name','description','status','notes','imageUrl','manufacturer',
    'author','publisher','year','metadata','barcode','isbn',
  ] as const;
  const data: Partial<Record<(typeof allowed)[number], unknown>> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }
  if (data.status && !Object.values(ItemStatus).includes(data.status as ItemStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  const item = await prisma.item.update({
    where: { id },
    data: data as Parameters<typeof prisma.item.update>[0]['data'],
    include: { catalogue: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.item.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
