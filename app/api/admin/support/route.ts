import { NextResponse } from 'next/server';

import { db } from '@/src/lib/db';
import { requirePlatformAdmin } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

/*
 * GET /api/admin/support
 *
 * Cross-restaurant list of support conversations for the platform team,
 * escalated ones first. Gated by PLATFORM_ADMIN_EMAILS, not tied to any
 * restaurant membership.
 */
export async function GET() {
  try {
    const access = await requirePlatformAdmin();

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const conversations = await db.supportConversation.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        restaurant: { select: { id: true, name: true } },
        staff: { select: { user: { select: { name: true, email: true } } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      take: 200,
    });

    conversations.sort((a, b) => {
      const rank = (status: string) =>
        status === 'ESCALATED' ? 0 : status === 'OPEN' ? 1 : 2;
      return rank(a.status) - rank(b.status);
    });

    return NextResponse.json(
      conversations.map((conversation) => ({
        id: conversation.id,
        status: conversation.status,
        updatedAt: conversation.updatedAt,
        restaurant: conversation.restaurant,
        staff: conversation.staff.user,
        lastMessage: conversation.messages[0]?.content ?? null,
      }))
    );
  } catch (err) {
    console.error('GET /api/admin/support error:', err);
    return errorResponse(err);
  }
}
