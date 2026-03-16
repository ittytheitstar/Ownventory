import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const catalogueId = searchParams.get('catalogueId');

  const collections = await prisma.collection.findMany({
    where: catalogueId ? { catalogueId } : undefined,
    orderBy: { name: 'asc' },
    include: {
      catalogue: { select: { name: true, icon: true } },
      _count: { select: { items: true } },
    },
  });
  return NextResponse.json(collections);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, description, catalogueId } = body;

  if (!name || !catalogueId) {
    return NextResponse.json({ error: 'name and catalogueId are required' }, { status: 400 });
  }

  const collection = await prisma.collection.create({
    data: { name, description, catalogueId },
    include: { catalogue: true },
  });
  return NextResponse.json(collection, { status: 201 });
}
