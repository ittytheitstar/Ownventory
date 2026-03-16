import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  return { user, response: null };
}

export async function requireOwner() {
  const result = await requireAuth();
  if (result.response) return result;

  if (result.user?.role !== 'OWNER') {
    return {
      user: result.user,
      response: NextResponse.json({ error: 'Owner access required' }, { status: 403 }),
    };
  }

  return result;
}
