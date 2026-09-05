import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { hashPassword, verifyPassword, createStaffSession } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';
import { rateLimit, clientIp } from '@/src/lib/rate-limit';
import { verifySameOrigin, crossOriginRejection } from '@/src/lib/csrf';

/*
 * Public — no session required. This is how a waiter/kitchen hire creates
 * their own account, given the shared password their manager set in
 * Settings (Restaurant.staffJoinPasswordHash), instead of the manager
 * typing every new hire's account in by hand on the Personal page (which
 * still works exactly as before — this is an additional path, not a
 * replacement).
 */

// GET lets the /join/[slug] page show a clear "ask your manager" state
// instead of a form that's guaranteed to fail when no password is set.
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurant = await db.restaurant.findUnique({
    where: { slug: params.slug },
    select: { name: true, isActive: true, staffJoinPasswordHash: true },
  });

  if (!restaurant || !restaurant.isActive) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  return NextResponse.json({
    restaurantName: restaurant.name,
    acceptsJoin: !!restaurant.staffJoinPasswordHash,
  });
}

const schema = z.object({
  staffJoinPassword: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  password: z.string().min(10).max(200),
  staffPortal: z.enum(['WAITER', 'KITCHEN']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    if (!verifySameOrigin(req)) {
      return crossOriginRejection();
    }

    const ip = clientIp(req.headers);

    // Two independent limiters: per-IP (mirrors auth/register) catches one
    // attacker hammering from one place; per-restaurant catches a guessed
    // password being brute-forced from many IPs at once — a risk unique to
    // this endpoint, since the secret being checked is shared/operational
    // rather than tied to one person.
    const ipLimit = await rateLimit(`staff-join:${ip}`, 5, 60 * 60 * 1000);
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: 'Too many attempts, try again later' },
        { status: 429 }
      );
    }

    const restaurantLimit = await rateLimit(
      `staff-join-restaurant:${params.slug}`,
      20,
      60 * 60 * 1000
    );
    if (!restaurantLimit.ok) {
      return NextResponse.json(
        { error: 'Too many attempts, try again later' },
        { status: 429 }
      );
    }

    const body = schema.parse(await req.json());

    const restaurant = await db.restaurant.findUnique({
      where: { slug: params.slug },
      select: { id: true, isActive: true, staffJoinPasswordHash: true },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    if (!restaurant.staffJoinPasswordHash) {
      return NextResponse.json(
        {
          error:
            "Staff registration isn't set up for this restaurant yet — ask your manager.",
        },
        { status: 400 }
      );
    }

    const passwordOk = await verifyPassword(
      body.staffJoinPassword,
      restaurant.staffJoinPasswordHash
    );

    if (!passwordOk) {
      return NextResponse.json(
        { error: 'Incorrect restaurant password.' },
        { status: 401 }
      );
    }

    const email = body.email.toLowerCase();

    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with that email already exists. Use a different email.' },
        { status: 409 }
      );
    }

    const { user } = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: body.name,
          email,
          passwordHash: await hashPassword(body.password),
        },
        select: { id: true, name: true, email: true },
      });

      await tx.restaurantStaff.create({
        data: {
          userId: createdUser.id,
          restaurantId: restaurant.id,
          role: 'STAFF',
          staffPortal: body.staffPortal,
          isActive: true,
        },
      });

      return { user: createdUser };
    });

    await createStaffSession(user.id, body.staffPortal);

    return NextResponse.json(
      { ...user, restaurantId: restaurant.id, staffPortal: body.staffPortal },
      { status: 201 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
