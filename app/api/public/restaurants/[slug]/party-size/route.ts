import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { readSessionTokenFromCookies, verifyCustomerSession } from '@/src/lib/customer-session';
import { errorResponse } from '@/src/lib/api-response';

// Public, unauthenticated endpoint (like the menu route) — the customer
// sets their table's headcount right after opening the QR/NFC link, before
// browsing the menu. Scoped to the customer session already minted for
// this restaurant+table, so a request can only ever update the party's own
// session, never anyone else's.
const schema = z.object({ partySize: z.number().int().min(1).max(30) });

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const restaurant = await db.restaurant.findUnique({ where: { slug: params.slug } });
    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const token = readSessionTokenFromCookies(restaurant.id);
    const session = await verifyCustomerSession(restaurant.id, token);
    if (!session) {
      return NextResponse.json({ error: 'No active table session' }, { status: 401 });
    }

    const body = schema.parse(await req.json());

    const updated = await db.customerSession.update({
      where: { id: session.id },
      data: { partySize: body.partySize },
      select: { id: true, partySize: true },
    });

    return NextResponse.json({ session: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
