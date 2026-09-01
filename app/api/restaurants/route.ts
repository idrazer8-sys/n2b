import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { getCurrentUser } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const schema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(2).max(60).regex(slugPattern, 'Use lowercase letters, numbers, and hyphens only'),
  currency: z.string().length(3).default('EUR'),
});

// GET: list restaurants the current user has a staff role at (their own
// tenants only — never a global restaurant list).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const memberships = await db.restaurantStaff.findMany({
    where: { userId: user.id },
    include: { restaurant: true },
  });

  return NextResponse.json(memberships.map((m) => ({ role: m.role, restaurant: m.restaurant })));
}

// POST: create a restaurant. The creator automatically becomes OWNER.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = schema.parse(await req.json());

    const slugTaken = await db.restaurant.findUnique({ where: { slug: body.slug } });
    if (slugTaken) {
      return NextResponse.json({ error: 'That URL slug is already taken' }, { status: 409 });
    }

    const restaurant = await db.restaurant.create({
      data: {
        name: body.name,
        slug: body.slug,
        currency: body.currency,
        staff: { create: { userId: user.id, role: 'OWNER' } },
        membership: { create: {} },
      },
    });

    return NextResponse.json(restaurant, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
