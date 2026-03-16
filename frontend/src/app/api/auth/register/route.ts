import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { hashPassword, hasUsers, setSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireOwner } from '@/lib/route-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json();
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const requestedRole = body.role as UserRole | undefined;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const usersExist = await hasUsers();
  const role = requestedRole && Object.values(UserRole).includes(requestedRole)
    ? requestedRole
    : (usersExist ? UserRole.VIEWER : UserRole.OWNER);

  if (usersExist) {
    const auth = await requireOwner();
    if (auth.response) return auth.response;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!usersExist) {
    await setSessionCookie({ id: user.id, role: user.role });
  }

  return NextResponse.json(user, { status: 201 });
}
