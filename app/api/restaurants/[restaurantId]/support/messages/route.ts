import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';
import {
  getSupportAssistantReply,
  AiNotConfiguredError,
} from '@/src/lib/ai';

const MAX_HISTORY_MESSAGES = 20;

async function notifyEscalation(params: {
  restaurantName: string;
  staffName: string;
  message: string;
  conversationId: string;
}) {
  const webhookUrl = process.env.SUPPORT_ESCALATION_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `NOT2BUSY support escalation — ${params.restaurantName} (${params.staffName}): "${params.message}" [conversation ${params.conversationId}]`,
      }),
    });
  } catch (err) {
    // Best-effort only — a failed notification should never break the chat.
    console.error('Support escalation webhook failed:', err);
  }
}

/*
 * GET /api/restaurants/[restaurantId]/support/messages
 *
 * Returns the current manager's most recent support conversation (if any)
 * so the chat widget can restore history after a page refresh.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'MANAGER'
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const conversation = await db.supportConversation.findFirst({
      where: {
        restaurantId: params.restaurantId,
        staffId: access.membership.id,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ conversation: null });
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        messages: conversation.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error(
      'GET /api/restaurants/[restaurantId]/support/messages error:',
      err
    );

    return errorResponse(err);
  }
}

const schema = z.object({
  conversationId: z.string().min(1).optional(),
  message: z.string().trim().min(1).max(2000),
});

/*
 * POST /api/restaurants/[restaurantId]/support/messages
 *
 * Sends a manager's chat message to the built-in AI support assistant and
 * stores both sides of the exchange. If the assistant decides it can't
 * help, the conversation is marked ESCALATED and (if configured) a
 * webhook notification is fired so a human can follow up.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'MANAGER'
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const body = schema.parse(await req.json());

    const restaurant = await db.restaurant.findUnique({
      where: { id: params.restaurantId },
      select: { name: true },
    });

    let conversation = body.conversationId
      ? await db.supportConversation.findFirst({
          where: {
            id: body.conversationId,
            restaurantId: params.restaurantId,
            staffId: access.membership.id,
          },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        })
      : null;

    if (!conversation) {
      conversation = await db.supportConversation.create({
        data: {
          restaurantId: params.restaurantId,
          staffId: access.membership.id,
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    await db.supportMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: body.message,
      },
    });

    const history = [
      ...conversation.messages.map((message) => ({
        role: message.role === 'USER' ? ('user' as const) : ('assistant' as const),
        content: message.content,
      })),
      { role: 'user' as const, content: body.message },
    ].slice(-MAX_HISTORY_MESSAGES);

    const { reply, escalate } = await getSupportAssistantReply({
      restaurantName: restaurant?.name ?? 'this restaurant',
      history,
    });

    await db.supportMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: reply,
      },
    });

    const updated = await db.supportConversation.update({
      where: { id: conversation.id },
      data: escalate ? { status: 'ESCALATED' } : {},
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (escalate) {
      await notifyEscalation({
        restaurantName: restaurant?.name ?? 'Unknown restaurant',
        staffName: access.user.name,
        message: body.message,
        conversationId: conversation.id,
      });
    }

    return NextResponse.json({
      conversation: {
        id: updated.id,
        status: updated.status,
        messages: updated.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        })),
      },
    });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    console.error(
      'POST /api/restaurants/[restaurantId]/support/messages error:',
      err
    );

    return errorResponse(err);
  }
}
