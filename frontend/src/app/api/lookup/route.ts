import { NextResponse } from 'next/server';
import { lookupItem } from '@/lib/item-lookup';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 });

  const result = await lookupItem(q);
  return NextResponse.json(result);
}
