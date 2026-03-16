import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/route-auth';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id },
    select: { id: true, name: true, barcode: true },
  });

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const payload = item.barcode || item.id;
  const svg = await QRCode.toString(payload, {
    type: 'svg',
    margin: 1,
    width: 256,
  });

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
