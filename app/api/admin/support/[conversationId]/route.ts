import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/src/lib/db';
import { requirePlatformAdmin } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

type Context = { params: { conversationId: string } };

export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const access = await requirePlatformAdmin();
    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const conversation = await db.supportConversation.findUnique({
      where: { id: params.conversationId },
      include: {
        restaurant: { select: { id: true, name: true } },
        staff: { select: { user: { select: { name: true, email: true } } } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: conversation.id,
      status: conversation.status,
      restaurant: conversation.restaurant,
      staff: conversation.staff.user,
      messages: conversation.messages,
    });
  } catch (err) {
    console.error('GET /api/admin/support/[conversationId] error:', err);
    return errorResponse(err);
  }
}

const patchSchema = z.object({
  message: z.string().trim().min(1).max(2000).optional(),
  status: z.enum(['OPEN', 'ESCALATED', 'RESOLVED']).optional(),
});

/*
 * PATCH /api/admin/support/[conversationId]
 *
 * Lets a platform admin reply into a manager's support chat (stored as a
 * HUMAN message, shown distinctly in the widget) and/or change the
 * conversation's status (e.g. mark it RESOLVED once handled).
 */
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    const access = await requirePlatformAdmin();
    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const body = patchSchema.parse(await req.json());

    const conversation = await db.supportConversation.findUnique({
      where: { id: params.conversationId },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (body.message) {
      await db.supportMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'HUMAN',
          content: body.message,
        },
      });
    }

    const updated = await db.supportConversation.update({
      where: { id: conversation.id },
      data: { status: body.status ?? undefined },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      messages: updated.messages,
    });
  } catch (err) {
    console.error('PATCH /api/admin/support/[conversationId] error:', err);
    return errorResponse(err);
  }
}
