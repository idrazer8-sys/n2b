import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { hashPassword, createStaffSession } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';
import { rateLimit, clientIp } from '@/src/lib/rate-limit';
import { verifySameOrigin, crossOriginRejection } from '@/src/lib/csrf';

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  password: z.string().min(10).max(200),
});

export async function POST(req: NextRequest) {
  try {
    if (!verifySameOrigin(req)) {
      return crossOriginRejection();
    }

    const ip = clientIp(req.headers);
    const limited = await rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json({ error: 'Too many attempts, try again later' }, { status: 429 });
    }

    const body = schema.parse(await req.json());
    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing) {
      // Deliberately generic — do not confirm whether an email is registered.
      return NextResponse.json({ error: 'Could not create account' }, { status: 400 });
    }

    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: await hashPassword(body.password),
      },
    });

    await createStaffSession(user.id);
    return NextResponse.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    return errorResponse(err);
  }
}
