import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireOwner } from '@/lib/route-auth';
import { serializeStocktakeSession, stocktakeSessionArgs } from '@/lib/stocktake';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const session = await prisma.stocktakeSession.findUnique({
    where: { id },
    ...stocktakeSessionArgs,
  });

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(serializeStocktakeSession(session));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json();

  const session = await prisma.stocktakeSession.update({
    where: { id },
    data: {
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(Object.prototype.hasOwnProperty.call(body, 'notes') ? { notes: body.notes?.trim() || null } : {}),
      ...(body.end ? { endedAt: new Date() } : {}),
    },
    ...stocktakeSessionArgs,
  });

  return NextResponse.json(serializeStocktakeSession(session));
}
