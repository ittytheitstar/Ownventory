import { NextResponse } from 'next/server';
import { lookupItem } from '@/lib/item-lookup';
import { requireAuth } from '@/lib/route-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 });

  const result = await lookupItem(q);
  return NextResponse.json(result);
}
