import { NextResponse } from 'next/server';
import { getSessionUser, hasUsers } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [user, usersExist] = await Promise.all([getSessionUser(), hasUsers()]);
  return NextResponse.json({
    user,
    needsSetup: !usersExist,
  });
}
